# VT vs NCSU Wrestling Dual Probability Analysis

A comprehensive probability analysis tool for Virginia Tech vs NC State wrestling duals. Computes all possible match outcome paths and calculates win probabilities with adjustable parameters.

## Live Demo

Open `docs/index.html` in a browser for the full interactive experience, or use `wrestling_interactive.html` for the standalone version.

## Features

- **1.07 Billion Paths Computed** - Exhaustive brute-force analysis of all possible match outcome combinations
- **Real-time Win Probability** - Updates as you lock in actual match results
- **Score Differential Distribution** - Visual breakdown of likely final score margins
- **Win Probability Timeline** - Track how VT's chances evolve match by match
- **Most Likely Paths** - See the highest probability outcome sequences
- **Prediction Calibration** - Brier score tracking to measure prediction accuracy
- **Adjustable Parameters**:
  - Home advantage bias
  - Unsportsmanlike conduct probability adjustments

## Files

| File | Description |
|------|-------------|
| `docs/index.html` | Main interactive analysis page (GitHub Pages ready) |
| `wrestling_interactive.html` | Standalone interactive version |
| `wrestling_viz.html` | Static visualization |
| `wrestling_analysis.py` | Python analysis and visualization scripts |
| `wrestling_bruteforce.py` | Python brute-force path computation |
| `wrestling_bruteforce.c` | C implementation for faster computation |
| `wrestling_bruteforce_data.js` | Pre-computed probability data |
| `wrestling_*.png` | Generated heatmaps and differential charts |

## Match Data

The analysis includes all 10 weight classes with individual match probabilities:
- 125, 133, 141, 149, 157, 165, 174, 184, 197, 285 lbs

Each match has 8 possible outcomes:
- NCSU wins by: -6, -5, -4, -3 points
- VT wins by: +3, +4, +5, +6 points

## Usage

### View Interactive Analysis
```bash
# Open in browser
open docs/index.html
```

### Run Python Analysis
```bash
python wrestling_analysis.py
```

### Compile and Run C Brute Force
```bash
gcc -O3 -o wrestling_bruteforce wrestling_bruteforce.c
./wrestling_bruteforce
```

## Technical Details

- **Frontend**: Vanilla HTML/CSS/JS with custom styling
- **Visualization**: Dynamic SVG charts, real-time probability updates
- **Computation**: Dynamic programming for efficient probability calculation
- **Audio**: Victory fanfare and sad trombone sound effects

---

Go Hokies! 🦃
