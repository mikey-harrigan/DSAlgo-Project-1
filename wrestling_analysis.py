#!/usr/bin/env python3
"""
VT vs NCSU Wrestling Dual Meet Probability Analysis
Using Dynamic Programming for efficient calculation
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LogNorm
import matplotlib.patches as mpatches

# Match data: [VT wrestler, NCSU wrestler, probabilities for -6,-5,-4,-3,+3,+4,+5,+6]
# Negative = NCSU wins, Positive = VT wins
matches = [
    ("#3 Ventresca", "#5 Robinson", [1.5, 1, 5, 20, 55, 15, 1, 1.5]),
    ("#7 Seidel", "#33 Redding", [2.25, 0.25, 0.5, 7, 5, 10, 60, 15]),
    ("#22 Crook", "#13 Jack", [2.5, 7.5, 40, 30, 15, 3, 0.5, 1.5]),
    ("#9 Gaj", "#5 Buesgens", [1, 1.5, 20, 38, 25, 10, 2.5, 2]),
    ("#16 Miller", "Tucker", [2, 0.25, 2.75, 15, 35, 20, 20, 5]),
    ("#12 Burton", "#13 Denny", [0.5, 1, 12, 34.5, 37.5, 13, 0.5, 1]),
    ("#31 Desiante", "#4 Singleton", [3, 35, 25, 27, 8, 1.25, 0.25, 0.5]),
    ("#32 Bullock", "Gates", [0.5, 1, 12, 33, 36, 15, 2, 0.5]),
    ("#17 Sasso", "#26 Brophy", [1.5, 1, 7.5, 12.5, 40, 30, 5, 2.5]),
    ("#16 Mullen", "#2 Trumble", [2, 3, 30, 47.25, 15, 2, 0.25, 0.5]),
]

# Outcome mappings: outcome -> (VT points, NCSU points)
outcomes = {
    -6: (0, 6),  # NCSU wins by fall
    -5: (0, 5),  # NCSU wins by tech fall
    -4: (0, 4),  # NCSU wins by major decision
    -3: (0, 3),  # NCSU wins by decision
    +3: (3, 0),  # VT wins by decision
    +4: (4, 0),  # VT wins by major decision
    +5: (5, 0),  # VT wins by tech fall
    +6: (6, 0),  # VT wins by fall
}

outcome_order = [-6, -5, -4, -3, +3, +4, +5, +6]

# Biases
BIASES = {
    "home_advantage": {"differential": -3.9, "probability": 1.0},  # 100% chance, shifts -3.9
    "unsport_minus": {"differential": -1, "probability": 0.01},    # 1% chance
    "unsport_plus": {"differential": +1, "probability": 0.05},     # 5% chance
}

def calculate_score_probabilities():
    """
    Use DP to calculate probability distribution of (VT_score, NCSU_score)
    Time complexity: O(matches * max_vt * max_ncsu * outcomes) = O(10 * 61 * 61 * 8) ≈ 300k ops
    """
    max_score = 61  # 0 to 60 inclusive

    # dp[vt_score][ncsu_score] = probability
    dp = np.zeros((max_score, max_score))
    dp[0][0] = 1.0  # Start with 0-0

    for match_idx, (vt_wrestler, ncsu_wrestler, probs) in enumerate(matches):
        new_dp = np.zeros((max_score, max_score))

        for vt_score in range(max_score):
            for ncsu_score in range(max_score):
                if dp[vt_score][ncsu_score] == 0:
                    continue

                current_prob = dp[vt_score][ncsu_score]

                for outcome_idx, outcome in enumerate(outcome_order):
                    vt_pts, ncsu_pts = outcomes[outcome]
                    outcome_prob = probs[outcome_idx] / 100.0

                    new_vt = vt_score + vt_pts
                    new_ncsu = ncsu_score + ncsu_pts

                    if new_vt < max_score and new_ncsu < max_score:
                        new_dp[new_vt][new_ncsu] += current_prob * outcome_prob

        dp = new_dp
        print(f"Processed match {match_idx + 1}/10: {vt_wrestler} vs {ncsu_wrestler}")

    return dp

def calculate_differential_distribution(score_probs):
    """Calculate probability distribution of score differential (VT - NCSU)"""
    max_score = score_probs.shape[0]
    # Differential ranges from -60 to +60
    diff_probs = {}

    for vt_score in range(max_score):
        for ncsu_score in range(max_score):
            if score_probs[vt_score][ncsu_score] > 0:
                diff = vt_score - ncsu_score
                diff_probs[diff] = diff_probs.get(diff, 0) + score_probs[vt_score][ncsu_score]

    return diff_probs

def apply_biases(diff_probs):
    """Apply bias factors to differential distribution"""
    # This is a simplified model - in reality biases interact complexly
    # We'll model them as additive shifts to the distribution

    biased_probs = {}

    # Start with original distribution
    for diff, prob in diff_probs.items():
        biased_probs[diff] = prob

    # Apply home advantage (shift entire distribution by -3.9, i.e., toward NCSU)
    # Since we can only have integer scores, we'll interpolate
    home_shift = BIASES["home_advantage"]["differential"]
    shifted_probs = {}

    for diff, prob in biased_probs.items():
        # Distribute between floor and ceil
        floor_diff = int(np.floor(diff + home_shift))
        ceil_diff = int(np.ceil(diff + home_shift))
        frac = (diff + home_shift) - floor_diff

        shifted_probs[floor_diff] = shifted_probs.get(floor_diff, 0) + prob * (1 - frac)
        shifted_probs[ceil_diff] = shifted_probs.get(ceil_diff, 0) + prob * frac

    biased_probs = shifted_probs

    # Apply unsportsmanlike conduct probabilities
    # -1 point with 1% chance, +1 point with 5% chance
    # Net effect: shift some probability mass

    final_probs = {}
    p_no_unsport = (1 - BIASES["unsport_minus"]["probability"]) * (1 - BIASES["unsport_plus"]["probability"])
    p_minus_only = BIASES["unsport_minus"]["probability"] * (1 - BIASES["unsport_plus"]["probability"])
    p_plus_only = (1 - BIASES["unsport_minus"]["probability"]) * BIASES["unsport_plus"]["probability"]
    p_both = BIASES["unsport_minus"]["probability"] * BIASES["unsport_plus"]["probability"]

    for diff, prob in biased_probs.items():
        # No unsportsmanlike
        final_probs[diff] = final_probs.get(diff, 0) + prob * p_no_unsport
        # -1 unsportsmanlike only (VT loses 1 point)
        final_probs[diff - 1] = final_probs.get(diff - 1, 0) + prob * p_minus_only
        # +1 unsportsmanlike only (VT gains 1 point)
        final_probs[diff + 1] = final_probs.get(diff + 1, 0) + prob * p_plus_only
        # Both (net 0)
        final_probs[diff] = final_probs.get(diff, 0) + prob * p_both

    return final_probs

def plot_heatmap(score_probs, title, filename):
    """Plot heatmap of VT score vs NCSU score"""
    fig, ax = plt.subplots(figsize=(14, 12))

    # Find non-zero region
    nonzero = np.where(score_probs > 1e-10)
    if len(nonzero[0]) == 0:
        print("No non-zero probabilities!")
        return

    min_vt, max_vt = nonzero[0].min(), nonzero[0].max()
    min_ncsu, max_ncsu = nonzero[1].min(), nonzero[1].max()

    # Add some padding
    min_vt = max(0, min_vt - 2)
    max_vt = min(60, max_vt + 2)
    min_ncsu = max(0, min_ncsu - 2)
    max_ncsu = min(60, max_ncsu + 2)

    subset = score_probs[min_vt:max_vt+1, min_ncsu:max_ncsu+1]

    # Use log scale for better visualization
    subset_plot = np.where(subset > 1e-10, subset, 1e-10)

    im = ax.imshow(subset_plot.T, origin='lower', aspect='auto',
                   norm=LogNorm(vmin=1e-6, vmax=subset.max()),
                   cmap='hot', extent=[min_vt-0.5, max_vt+0.5, min_ncsu-0.5, max_ncsu+0.5])

    # Draw breakeven line (VT score = NCSU score)
    line_range = np.linspace(max(min_vt, min_ncsu), min(max_vt, max_ncsu), 100)
    ax.plot(line_range, line_range, 'c--', linewidth=2, label='Tie Line (VT=NCSU)')

    # Add VT wins / NCSU wins labels
    ax.fill_between([min_vt, max_vt], [min_vt, max_vt], [min_ncsu, min_ncsu],
                    alpha=0.1, color='blue', label='VT Wins Region')
    ax.fill_between([min_vt, max_vt], [max_ncsu, max_ncsu], [min_vt, max_vt],
                    alpha=0.1, color='red', label='NCSU Wins Region')

    ax.set_xlabel('VT Score', fontsize=12)
    ax.set_ylabel('NCSU Score', fontsize=12)
    ax.set_title(title, fontsize=14)

    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Probability (log scale)', fontsize=10)

    ax.legend(loc='upper left')

    plt.tight_layout()
    plt.savefig(filename, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {filename}")

def plot_differential(diff_probs, title, filename, show_biased=False, biased_probs=None):
    """Plot probability distribution of score differential"""
    fig, ax = plt.subplots(figsize=(14, 8))

    diffs = sorted(diff_probs.keys())
    probs = [diff_probs[d] for d in diffs]

    bars = ax.bar(diffs, probs, alpha=0.7, color='steelblue', label='Base Probability')

    if show_biased and biased_probs:
        biased_diffs = sorted(biased_probs.keys())
        biased_probs_list = [biased_probs[d] for d in biased_diffs]
        ax.plot(biased_diffs, biased_probs_list, 'r-', linewidth=2,
                label='With Biases', marker='o', markersize=3)

    # Draw breakeven line at 0
    ax.axvline(x=0, color='green', linestyle='--', linewidth=2, label='Breakeven (Tie)')

    # Shade VT wins vs NCSU wins
    ax.axvspan(0.5, max(diffs) + 1, alpha=0.1, color='blue', label='VT Wins')
    ax.axvspan(min(diffs) - 1, -0.5, alpha=0.1, color='red', label='NCSU Wins')

    # Calculate win probabilities
    vt_win_prob = sum(p for d, p in diff_probs.items() if d > 0)
    ncsu_win_prob = sum(p for d, p in diff_probs.items() if d < 0)
    tie_prob = diff_probs.get(0, 0)

    textstr = f'VT Win: {vt_win_prob*100:.2f}%\nNCSU Win: {ncsu_win_prob*100:.2f}%\nTie: {tie_prob*100:.2f}%'
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.8)
    ax.text(0.02, 0.98, textstr, transform=ax.transAxes, fontsize=11,
            verticalalignment='top', bbox=props)

    if show_biased and biased_probs:
        vt_win_biased = sum(p for d, p in biased_probs.items() if d > 0)
        ncsu_win_biased = sum(p for d, p in biased_probs.items() if d < 0)
        tie_biased = biased_probs.get(0, 0)

        textstr2 = f'With Biases:\nVT Win: {vt_win_biased*100:.2f}%\nNCSU Win: {ncsu_win_biased*100:.2f}%\nTie: {tie_biased*100:.2f}%'
        ax.text(0.98, 0.98, textstr2, transform=ax.transAxes, fontsize=11,
                verticalalignment='top', horizontalalignment='right', bbox=props)

    ax.set_xlabel('Score Differential (VT - NCSU)', fontsize=12)
    ax.set_ylabel('Probability', fontsize=12)
    ax.set_title(title, fontsize=14)
    ax.legend(loc='upper center')

    ax.set_xlim(min(diffs) - 1, max(diffs) + 1)

    plt.tight_layout()
    plt.savefig(filename, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {filename}")

def calculate_expected_value():
    """Calculate expected value from the match data"""
    total_ev = 0
    print("\n" + "="*70)
    print("INDIVIDUAL MATCH EXPECTED VALUES")
    print("="*70)

    for vt_wrestler, ncsu_wrestler, probs in matches:
        ev = 0
        for outcome_idx, outcome in enumerate(outcome_order):
            ev += outcome * (probs[outcome_idx] / 100.0)
        total_ev += ev
        print(f"{vt_wrestler:15} vs {ncsu_wrestler:15}: EV = {ev:+.4f}")

    print("-"*70)
    print(f"{'TOTAL':15}    {'':15}: EV = {total_ev:+.4f}")

    # Add biases
    bias_ev = BIASES["home_advantage"]["differential"] * BIASES["home_advantage"]["probability"]
    bias_ev += BIASES["unsport_minus"]["differential"] * BIASES["unsport_minus"]["probability"]
    bias_ev += BIASES["unsport_plus"]["differential"] * BIASES["unsport_plus"]["probability"]

    print(f"\nBias adjustments: {bias_ev:+.4f}")
    print(f"Final EV with biases: {total_ev + bias_ev:+.4f}")

    return total_ev

def main():
    print("="*70)
    print("VT vs NCSU WRESTLING DUAL MEET PROBABILITY ANALYSIS")
    print("="*70)
    print("\nComplexity Analysis:")
    print(f"  Brute force: 8^10 = {8**10:,} combinations (~1 billion ops)")
    print(f"  DP approach: 10 × 61 × 61 × 8 = {10*61*61*8:,} ops")
    print(f"  Speedup: {8**10 / (10*61*61*8):.0f}x faster\n")

    # Calculate expected values first
    ev = calculate_expected_value()

    # Calculate score probabilities using DP
    print("\n" + "="*70)
    print("CALCULATING SCORE PROBABILITIES (DP Method)")
    print("="*70)
    score_probs = calculate_score_probabilities()

    # Verify probabilities sum to 1
    total_prob = np.sum(score_probs)
    print(f"\nTotal probability (should be 1.0): {total_prob:.10f}")

    # Calculate differential distribution
    diff_probs = calculate_differential_distribution(score_probs)

    # Calculate win probabilities
    vt_win_prob = sum(p for d, p in diff_probs.items() if d > 0)
    ncsu_win_prob = sum(p for d, p in diff_probs.items() if d < 0)
    tie_prob = diff_probs.get(0, 0)

    print("\n" + "="*70)
    print("BASE PROBABILITIES (No Biases)")
    print("="*70)
    print(f"  VT Win Probability:   {vt_win_prob*100:.4f}%")
    print(f"  NCSU Win Probability: {ncsu_win_prob*100:.4f}%")
    print(f"  Tie Probability:      {tie_prob*100:.4f}%")

    # Find most likely scores
    print("\n  Top 10 Most Likely Score Combinations:")
    flat_idx = np.argsort(score_probs.flatten())[::-1][:10]
    for i, idx in enumerate(flat_idx):
        vt_score = idx // score_probs.shape[1]
        ncsu_score = idx % score_probs.shape[1]
        prob = score_probs[vt_score, ncsu_score]
        winner = "VT" if vt_score > ncsu_score else ("NCSU" if ncsu_score > vt_score else "TIE")
        print(f"    {i+1}. VT {vt_score} - NCSU {ncsu_score} ({winner}): {prob*100:.4f}%")

    # Apply biases
    biased_diff_probs = apply_biases(diff_probs)

    vt_win_biased = sum(p for d, p in biased_diff_probs.items() if d > 0)
    ncsu_win_biased = sum(p for d, p in biased_diff_probs.items() if d < 0)
    tie_biased = sum(p for d, p in biased_diff_probs.items() if d == 0)

    print("\n" + "="*70)
    print("PROBABILITIES WITH BIASES")
    print("="*70)
    print("  Biases applied:")
    print(f"    - Home Advantage: {BIASES['home_advantage']['differential']:+.1f} points (100% certain)")
    print(f"    - Unsportsmanlike -1: {BIASES['unsport_minus']['probability']*100:.0f}% chance")
    print(f"    - Unsportsmanlike +1: {BIASES['unsport_plus']['probability']*100:.0f}% chance")
    print(f"\n  VT Win Probability:   {vt_win_biased*100:.4f}%")
    print(f"  NCSU Win Probability: {ncsu_win_biased*100:.4f}%")
    print(f"  Tie Probability:      {tie_biased*100:.4f}%")

    # Generate plots
    print("\n" + "="*70)
    print("GENERATING VISUALIZATIONS")
    print("="*70)

    # Plot 1: Heatmap without biases
    plot_heatmap(score_probs,
                 'VT vs NCSU Score Probability Heatmap (Base)',
                 'wrestling_heatmap_base.png')

    # Plot 2: Differential distribution without biases
    plot_differential(diff_probs,
                     'Score Differential Probability Distribution (Base)',
                     'wrestling_differential_base.png')

    # Plot 3: Differential distribution with biases comparison
    plot_differential(diff_probs,
                     'Score Differential: Base vs With Biases',
                     'wrestling_differential_comparison.png',
                     show_biased=True, biased_probs=biased_diff_probs)

    # Plot 4: Just biased differential
    plot_differential(biased_diff_probs,
                     'Score Differential Probability Distribution (With Biases)',
                     'wrestling_differential_biased.png')

    print("\n" + "="*70)
    print("ANALYSIS COMPLETE")
    print("="*70)
    print("\nGenerated files:")
    print("  1. wrestling_heatmap_base.png - Score probability heatmap")
    print("  2. wrestling_differential_base.png - Differential distribution (base)")
    print("  3. wrestling_differential_comparison.png - Base vs biased comparison")
    print("  4. wrestling_differential_biased.png - Differential distribution (with biases)")

if __name__ == "__main__":
    main()
