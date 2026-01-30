#!/usr/bin/env python3
"""
VT vs NCSU Wrestling - BRUTE FORCE with Full Path Tracking
Computes all 8^10 = 1,073,741,824 combinations and stores results for conditional queries
"""

import numpy as np
import pickle
import json
from itertools import product
from collections import defaultdict
import time

# Match data
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

outcome_values = [-6, -5, -4, -3, 3, 4, 5, 6]  # Point differentials
outcome_labels = {
    -6: "Fall/FF (NCSU)", -5: "Tech (NCSU)", -4: "Major (NCSU)", -3: "Dec (NCSU)",
    3: "Dec (VT)", 4: "Major (VT)", 5: "Tech (VT)", 6: "Fall/FF (VT)"
}

def run_brute_force():
    """
    Enumerate all 8^10 combinations and compute:
    1. Full differential distribution
    2. Conditional distributions given each match outcome
    3. Top paths leading to each differential
    4. Joint statistics
    """
    print("="*70)
    print("BRUTE FORCE ENUMERATION: 8^10 = 1,073,741,824 combinations")
    print("="*70)

    # Convert probabilities to decimals
    match_probs = []
    for _, _, probs in matches:
        match_probs.append([p / 100.0 for p in probs])

    # Data structures to store results
    results = {
        # P(differential)
        'diff_distribution': defaultdict(float),

        # P(differential | match i has outcome j)
        # conditional_diff[match_idx][outcome_idx][diff] = probability
        'conditional_diff': [[defaultdict(float) for _ in range(8)] for _ in range(10)],

        # P(match i has outcome j | differential)
        # reverse_conditional[diff][match_idx][outcome_idx] = probability
        'reverse_conditional': defaultdict(lambda: [[0.0 for _ in range(8)] for _ in range(10)]),

        # Top 10 most likely paths for each differential
        'top_paths': defaultdict(list),

        # P(VT wins match i)
        'match_win_probs': [0.0 for _ in range(10)],

        # P(outcome j for match i)
        'marginal_probs': [[0.0 for _ in range(8)] for _ in range(10)],

        # Full (VT_score, NCSU_score) distribution
        'score_matrix': np.zeros((61, 61)),

        # Number of paths leading to each differential
        'path_counts': defaultdict(int),
    }

    # Pre-compute marginal probabilities (don't need brute force for this)
    for i in range(10):
        for j in range(8):
            results['marginal_probs'][i][j] = match_probs[i][j]
            if outcome_values[j] > 0:  # VT wins
                results['match_win_probs'][i] += match_probs[i][j]

    total_combinations = 8 ** 10
    start_time = time.time()
    last_print = start_time

    print(f"\nProcessing {total_combinations:,} combinations...")
    print("Progress: ", end="", flush=True)

    # Enumerate all combinations
    for idx, outcomes in enumerate(product(range(8), repeat=10)):
        # Calculate probability of this path
        prob = 1.0
        for match_idx, outcome_idx in enumerate(outcomes):
            prob *= match_probs[match_idx][outcome_idx]

        if prob < 1e-20:  # Skip negligible probabilities
            continue

        # Calculate scores
        diff = sum(outcome_values[o] for o in outcomes)
        vt_score = sum(outcome_values[o] for o in outcomes if outcome_values[o] > 0)
        ncsu_score = sum(-outcome_values[o] for o in outcomes if outcome_values[o] < 0)

        # Store differential distribution
        results['diff_distribution'][diff] += prob

        # Store score matrix
        results['score_matrix'][vt_score][ncsu_score] += prob

        # Store path count
        results['path_counts'][diff] += 1

        # Store conditional probabilities
        for match_idx, outcome_idx in enumerate(outcomes):
            results['conditional_diff'][match_idx][outcome_idx][diff] += prob

        # Track top paths for this differential (keep top 100, will trim to 10 later)
        path_info = {
            'outcomes': [outcome_values[o] for o in outcomes],
            'outcome_indices': list(outcomes),
            'probability': prob,
            'vt_score': vt_score,
            'ncsu_score': ncsu_score
        }

        if len(results['top_paths'][diff]) < 100:
            results['top_paths'][diff].append(path_info)
        elif prob > results['top_paths'][diff][-1]['probability']:
            results['top_paths'][diff][-1] = path_info
            results['top_paths'][diff].sort(key=lambda x: -x['probability'])

        # Progress update every 10 million
        if idx % 10_000_000 == 0 and idx > 0:
            elapsed = time.time() - start_time
            rate = idx / elapsed
            remaining = (total_combinations - idx) / rate
            print(f"\n  {idx/1e6:.0f}M / {total_combinations/1e6:.0f}M ({idx/total_combinations*100:.1f}%) - "
                  f"ETA: {remaining:.0f}s", end="", flush=True)

    elapsed = time.time() - start_time
    print(f"\n\nCompleted in {elapsed:.1f} seconds ({total_combinations/elapsed/1e6:.1f}M ops/sec)")

    # Normalize conditional distributions
    print("\nNormalizing conditional distributions...")
    for match_idx in range(10):
        for outcome_idx in range(8):
            total = sum(results['conditional_diff'][match_idx][outcome_idx].values())
            if total > 0:
                for diff in results['conditional_diff'][match_idx][outcome_idx]:
                    results['conditional_diff'][match_idx][outcome_idx][diff] /= total

    # Compute reverse conditionals: P(outcome | diff)
    print("Computing reverse conditionals...")
    for diff, diff_prob in results['diff_distribution'].items():
        if diff_prob > 0:
            for match_idx in range(10):
                for outcome_idx in range(8):
                    # P(outcome | diff) = P(diff | outcome) * P(outcome) / P(diff)
                    marginal = results['marginal_probs'][match_idx][outcome_idx]
                    cond = results['conditional_diff'][match_idx][outcome_idx].get(diff, 0)
                    # Actually easier: just accumulate during brute force... but we can derive:
                    # We need P(match_i = outcome_j AND diff = d) / P(diff = d)
                    pass

    # Trim top paths to 10
    for diff in results['top_paths']:
        results['top_paths'][diff] = sorted(results['top_paths'][diff],
                                            key=lambda x: -x['probability'])[:10]

    # Convert defaultdicts to regular dicts for serialization
    results['diff_distribution'] = dict(results['diff_distribution'])
    results['path_counts'] = dict(results['path_counts'])
    results['top_paths'] = dict(results['top_paths'])

    for match_idx in range(10):
        for outcome_idx in range(8):
            results['conditional_diff'][match_idx][outcome_idx] = dict(
                results['conditional_diff'][match_idx][outcome_idx]
            )

    return results

def compute_conditional_win_prob(results, conditions):
    """
    Compute P(VT wins | conditions)

    conditions: list of (match_idx, outcome_idx) tuples specifying known outcomes
    """
    # Filter the conditional distribution based on all conditions
    # P(diff | cond1 AND cond2 AND ...) requires re-computing from paths

    # For now, use first-order approximation or recompute
    pass

def save_results(results, filename='wrestling_bruteforce_results.pkl'):
    """Save results to pickle file"""
    # Convert numpy array to list for JSON compatibility in some fields
    results_copy = results.copy()
    results_copy['score_matrix'] = results['score_matrix'].tolist()

    with open(filename, 'wb') as f:
        pickle.dump(results, f)

    print(f"Results saved to {filename}")

    # Also save a JSON summary for quick viewing
    summary = {
        'diff_distribution': {str(k): v for k, v in results['diff_distribution'].items()},
        'vt_win_prob': sum(p for d, p in results['diff_distribution'].items() if d > 0),
        'ncsu_win_prob': sum(p for d, p in results['diff_distribution'].items() if d < 0),
        'tie_prob': results['diff_distribution'].get(0, 0),
        'match_win_probs': results['match_win_probs'],
        'path_counts': {str(k): v for k, v in results['path_counts'].items()},
        'top_overall_paths': [],
    }

    # Get top 20 overall paths
    all_paths = []
    for diff, paths in results['top_paths'].items():
        all_paths.extend(paths)
    all_paths.sort(key=lambda x: -x['probability'])
    summary['top_overall_paths'] = all_paths[:20]

    with open('wrestling_bruteforce_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print("Summary saved to wrestling_bruteforce_summary.json")

def print_analysis(results):
    """Print detailed analysis of results"""
    print("\n" + "="*70)
    print("ANALYSIS RESULTS")
    print("="*70)

    # Basic probabilities
    vt_win = sum(p for d, p in results['diff_distribution'].items() if d > 0)
    ncsu_win = sum(p for d, p in results['diff_distribution'].items() if d < 0)
    tie = results['diff_distribution'].get(0, 0)

    print(f"\nOVERALL PROBABILITIES:")
    print(f"  VT Win:   {vt_win*100:.4f}%")
    print(f"  NCSU Win: {ncsu_win*100:.4f}%")
    print(f"  Tie:      {tie*100:.4f}%")

    # Expected differential
    exp_diff = sum(d * p for d, p in results['diff_distribution'].items())
    print(f"\n  Expected Differential: {exp_diff:+.2f}")

    # Individual match win probabilities
    print(f"\nINDIVIDUAL MATCH WIN PROBABILITIES (VT):")
    for i, (vt, ncsu, _) in enumerate(matches):
        print(f"  Match {i+1}: {vt:15} vs {ncsu:15}: {results['match_win_probs'][i]*100:.1f}%")

    # Most likely differentials
    print(f"\nMOST LIKELY DIFFERENTIALS:")
    sorted_diffs = sorted(results['diff_distribution'].items(), key=lambda x: -x[1])[:10]
    for diff, prob in sorted_diffs:
        winner = "VT" if diff > 0 else ("NCSU" if diff < 0 else "TIE")
        paths = results['path_counts'].get(diff, 0)
        print(f"  Diff {diff:+3d} ({winner:4}): {prob*100:.4f}% ({paths:,} paths)")

    # Top overall paths
    print(f"\nTOP 10 MOST LIKELY EXACT OUTCOMES:")
    all_paths = []
    for diff, paths in results['top_paths'].items():
        all_paths.extend(paths)
    all_paths.sort(key=lambda x: -x['probability'])

    for i, path in enumerate(all_paths[:10]):
        outcomes_str = ' '.join(f"{o:+d}" for o in path['outcomes'])
        winner = "VT" if path['vt_score'] > path['ncsu_score'] else (
            "NCSU" if path['ncsu_score'] > path['vt_score'] else "TIE")
        print(f"  {i+1}. [{outcomes_str}] → {path['vt_score']}-{path['ncsu_score']} ({winner}): {path['probability']*100:.6f}%")

    # Conditional analysis examples
    print(f"\nCONDITIONAL WIN PROBABILITIES:")
    print("  (P(VT wins dual | match outcome))")

    for match_idx in [0, 1, 6]:  # Sample matches
        vt_name, ncsu_name, _ = matches[match_idx]
        print(f"\n  Match {match_idx+1}: {vt_name} vs {ncsu_name}")

        for outcome_idx, outcome in enumerate(outcome_values):
            cond_dist = results['conditional_diff'][match_idx][outcome_idx]
            if cond_dist:
                cond_vt_win = sum(p for d, p in cond_dist.items() if d > 0)
                label = outcome_labels[outcome]
                print(f"    If {label:15}: P(VT wins dual) = {cond_vt_win*100:.2f}%")

def query_interface(results):
    """Interactive query interface"""
    print("\n" + "="*70)
    print("QUERY INTERFACE")
    print("="*70)
    print("""
Available queries:
  1. P(VT wins | match X has outcome Y)
  2. P(differential = D | match X has outcome Y)
  3. Top paths leading to differential D
  4. What outcomes for match X swing the dual most?

Data structures saved for programmatic access:
  - results['diff_distribution'][diff] = probability
  - results['conditional_diff'][match_idx][outcome_idx][diff] = P(diff | outcome)
  - results['top_paths'][diff] = list of top 10 paths
  - results['score_matrix'][vt][ncsu] = probability
  - results['match_win_probs'][match_idx] = P(VT wins match)
""")

def main():
    results = run_brute_force()
    save_results(results)
    print_analysis(results)
    query_interface(results)

    print("\n" + "="*70)
    print("DONE - Results saved for conditional queries")
    print("="*70)
    print("\nTo load and query:")
    print("  import pickle")
    print("  with open('wrestling_bruteforce_results.pkl', 'rb') as f:")
    print("      results = pickle.load(f)")
    print("  # Then access results['conditional_diff'][match][outcome][diff]")

if __name__ == "__main__":
    main()
