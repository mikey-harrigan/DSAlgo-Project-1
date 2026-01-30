#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Outcome point values: -6, -5, -4, -3, +3, +4, +5, +6
const int OUTCOMES[8] = {-6, -5, -4, -3, 3, 4, 5, 6};

// Match probabilities (as percentages * 1000 for integer math, then convert)
const double PROBS[10][8] = {
    {1.5, 1, 5, 20, 55, 15, 1, 1.5},       // Match 0: 125 lbs
    {2.25, 0.25, 0.5, 7, 5, 10, 60, 15},   // Match 1: 133 lbs
    {2.5, 7.5, 40, 30, 15, 3, 0.5, 1.5},   // Match 2: 141 lbs
    {1, 1.5, 20, 38, 25, 10, 2.5, 2},      // Match 3: 149 lbs
    {2, 0.25, 2.75, 15, 35, 20, 20, 5},    // Match 4: 157 lbs
    {0.5, 1, 12, 34.5, 37.5, 13, 0.5, 1},  // Match 5: 165 lbs
    {3, 35, 25, 27, 8, 1.25, 0.25, 0.5},   // Match 6: 174 lbs
    {0.5, 1, 12, 33, 36, 15, 2, 0.5},      // Match 7: 184 lbs
    {1.5, 1, 7.5, 12.5, 40, 30, 5, 2.5},   // Match 8: 197 lbs
    {2, 3, 30, 47.25, 15, 2, 0.25, 0.5}    // Match 9: 285 lbs
};

// Results storage
#define MAX_DIFF 61  // -60 to +60
#define DIFF_OFFSET 60
#define MAX_PATHS_PER_DIFF 20
#define MAX_SCORE 61

typedef struct {
    unsigned char outcomes[10];  // outcome indices 0-7
    double probability;
    int vt_score;
    int ncsu_score;
} Path;

// Global results
double diff_probs[121];  // diff_probs[diff + 60] = probability
double score_matrix[MAX_SCORE][MAX_SCORE];
Path top_paths[121][MAX_PATHS_PER_DIFF];
int path_counts[121];
long long total_paths[121];

// Conditional: P(diff | match i has outcome j)
double cond_diff[10][8][121];
double cond_totals[10][8];

// Pre-computed probability products for each match
double prob_table[10][8];

void init_prob_table() {
    for (int m = 0; m < 10; m++) {
        for (int o = 0; o < 8; o++) {
            prob_table[m][o] = PROBS[m][o] / 100.0;
        }
    }
}

void insert_path(int diff_idx, Path *new_path) {
    // Find insertion point (sorted by probability descending)
    int insert_pos = path_counts[diff_idx];
    for (int i = 0; i < path_counts[diff_idx]; i++) {
        if (new_path->probability > top_paths[diff_idx][i].probability) {
            insert_pos = i;
            break;
        }
    }

    if (insert_pos < MAX_PATHS_PER_DIFF) {
        // Shift paths down
        int shift_end = (path_counts[diff_idx] < MAX_PATHS_PER_DIFF) ?
                        path_counts[diff_idx] : MAX_PATHS_PER_DIFF - 1;
        for (int i = shift_end; i > insert_pos; i--) {
            top_paths[diff_idx][i] = top_paths[diff_idx][i-1];
        }
        top_paths[diff_idx][insert_pos] = *new_path;
        if (path_counts[diff_idx] < MAX_PATHS_PER_DIFF) {
            path_counts[diff_idx]++;
        }
    }
}

int main() {
    printf("========================================\n");
    printf("BRUTE FORCE C IMPLEMENTATION\n");
    printf("8^10 = 1,073,741,824 combinations\n");
    printf("========================================\n\n");

    init_prob_table();

    // Initialize
    memset(diff_probs, 0, sizeof(diff_probs));
    memset(score_matrix, 0, sizeof(score_matrix));
    memset(path_counts, 0, sizeof(path_counts));
    memset(total_paths, 0, sizeof(total_paths));
    memset(cond_diff, 0, sizeof(cond_diff));
    memset(cond_totals, 0, sizeof(cond_totals));

    clock_t start = clock();
    long long count = 0;
    long long total = 1073741824LL;

    // Iterate through all 8^10 combinations using nested loops (faster than recursion)
    // Using array to track current outcome indices
    int o[10];
    Path current_path;

    for (o[0] = 0; o[0] < 8; o[0]++) {
        double p0 = prob_table[0][o[0]];
        int d0 = OUTCOMES[o[0]];

        for (o[1] = 0; o[1] < 8; o[1]++) {
            double p1 = p0 * prob_table[1][o[1]];
            int d1 = d0 + OUTCOMES[o[1]];

            for (o[2] = 0; o[2] < 8; o[2]++) {
                double p2 = p1 * prob_table[2][o[2]];
                int d2 = d1 + OUTCOMES[o[2]];

                for (o[3] = 0; o[3] < 8; o[3]++) {
                    double p3 = p2 * prob_table[3][o[3]];
                    int d3 = d2 + OUTCOMES[o[3]];

                    for (o[4] = 0; o[4] < 8; o[4]++) {
                        double p4 = p3 * prob_table[4][o[4]];
                        int d4 = d3 + OUTCOMES[o[4]];

                        for (o[5] = 0; o[5] < 8; o[5]++) {
                            double p5 = p4 * prob_table[5][o[5]];
                            int d5 = d4 + OUTCOMES[o[5]];

                            for (o[6] = 0; o[6] < 8; o[6]++) {
                                double p6 = p5 * prob_table[6][o[6]];
                                int d6 = d5 + OUTCOMES[o[6]];

                                for (o[7] = 0; o[7] < 8; o[7]++) {
                                    double p7 = p6 * prob_table[7][o[7]];
                                    int d7 = d6 + OUTCOMES[o[7]];

                                    for (o[8] = 0; o[8] < 8; o[8]++) {
                                        double p8 = p7 * prob_table[8][o[8]];
                                        int d8 = d7 + OUTCOMES[o[8]];

                                        for (o[9] = 0; o[9] < 8; o[9]++) {
                                            double prob = p8 * prob_table[9][o[9]];
                                            int diff = d8 + OUTCOMES[o[9]];

                                            int diff_idx = diff + DIFF_OFFSET;

                                            // Accumulate differential probability
                                            diff_probs[diff_idx] += prob;
                                            total_paths[diff_idx]++;

                                            // Calculate VT and NCSU scores
                                            int vt_score = 0, ncsu_score = 0;
                                            for (int m = 0; m < 10; m++) {
                                                int pts = OUTCOMES[o[m]];
                                                if (pts > 0) vt_score += pts;
                                                else ncsu_score -= pts;
                                            }

                                            // Accumulate score matrix
                                            score_matrix[vt_score][ncsu_score] += prob;

                                            // Accumulate conditional probabilities
                                            for (int m = 0; m < 10; m++) {
                                                cond_diff[m][o[m]][diff_idx] += prob;
                                                cond_totals[m][o[m]] += prob;
                                            }

                                            // Track top paths (only if prob is significant)
                                            if (prob > 1e-10 &&
                                                (path_counts[diff_idx] < MAX_PATHS_PER_DIFF ||
                                                 prob > top_paths[diff_idx][path_counts[diff_idx]-1].probability)) {

                                                for (int m = 0; m < 10; m++) {
                                                    current_path.outcomes[m] = o[m];
                                                }
                                                current_path.probability = prob;
                                                current_path.vt_score = vt_score;
                                                current_path.ncsu_score = ncsu_score;
                                                insert_path(diff_idx, &current_path);
                                            }

                                            count++;
                                        }
                                    }
                                }
                            }
                        }

                        // Progress update every ~100M
                        if ((count % 100000000) == 0) {
                            double elapsed = (double)(clock() - start) / CLOCKS_PER_SEC;
                            double rate = count / elapsed / 1e6;
                            double remaining = (total - count) / (rate * 1e6);
                            printf("Progress: %.0f%% (%lld/%lld) - %.1f M/s - ETA: %.0fs\n",
                                   100.0 * count / total, count, total, rate, remaining);
                        }
                    }
                }
            }
        }
    }

    clock_t end = clock();
    double elapsed = (double)(end - start) / CLOCKS_PER_SEC;

    printf("\nCompleted in %.2f seconds (%.1f M combinations/sec)\n\n",
           elapsed, count / elapsed / 1e6);

    // Normalize conditional probabilities
    for (int m = 0; m < 10; m++) {
        for (int o = 0; o < 8; o++) {
            if (cond_totals[m][o] > 0) {
                for (int d = 0; d < 121; d++) {
                    cond_diff[m][o][d] /= cond_totals[m][o];
                }
            }
        }
    }

    // Calculate win probabilities
    double vt_win = 0, ncsu_win = 0, tie = 0;
    for (int d = 0; d < 121; d++) {
        int diff = d - DIFF_OFFSET;
        if (diff > 0) vt_win += diff_probs[d];
        else if (diff < 0) ncsu_win += diff_probs[d];
        else tie += diff_probs[d];
    }

    printf("========================================\n");
    printf("RESULTS\n");
    printf("========================================\n");
    printf("VT Win:   %.4f%%\n", vt_win * 100);
    printf("NCSU Win: %.4f%%\n", ncsu_win * 100);
    printf("Tie:      %.4f%%\n", tie * 100);

    // Write results to JSON file
    FILE *f = fopen("wrestling_bruteforce_data.js", "w");
    if (!f) {
        printf("Error: Could not create output file\n");
        return 1;
    }

    fprintf(f, "// Auto-generated brute force data\n");
    fprintf(f, "const BRUTEFORCE_DATA = {\n");

    // Differential probabilities
    fprintf(f, "  diffProbs: {");
    int first = 1;
    for (int d = 0; d < 121; d++) {
        if (diff_probs[d] > 1e-12) {
            if (!first) fprintf(f, ",");
            fprintf(f, "\"%d\":%.10e", d - DIFF_OFFSET, diff_probs[d]);
            first = 0;
        }
    }
    fprintf(f, "},\n");

    // Path counts
    fprintf(f, "  pathCounts: {");
    first = 1;
    for (int d = 0; d < 121; d++) {
        if (total_paths[d] > 0) {
            if (!first) fprintf(f, ",");
            fprintf(f, "\"%d\":%lld", d - DIFF_OFFSET, total_paths[d]);
            first = 0;
        }
    }
    fprintf(f, "},\n");

    // Score matrix (sparse)
    fprintf(f, "  scoreMatrix: {");
    first = 1;
    for (int vt = 0; vt < MAX_SCORE; vt++) {
        for (int ncsu = 0; ncsu < MAX_SCORE; ncsu++) {
            if (score_matrix[vt][ncsu] > 1e-12) {
                if (!first) fprintf(f, ",");
                fprintf(f, "\"%d,%d\":%.10e", vt, ncsu, score_matrix[vt][ncsu]);
                first = 0;
            }
        }
    }
    fprintf(f, "},\n");

    // Conditional probabilities: P(VT wins | match m has outcome o)
    fprintf(f, "  conditionalVTWin: [\n");
    for (int m = 0; m < 10; m++) {
        fprintf(f, "    [");
        for (int o = 0; o < 8; o++) {
            double vt_cond = 0;
            for (int d = DIFF_OFFSET + 1; d < 121; d++) {
                vt_cond += cond_diff[m][o][d];
            }
            fprintf(f, "%.6f%s", vt_cond, o < 7 ? "," : "");
        }
        fprintf(f, "]%s\n", m < 9 ? "," : "");
    }
    fprintf(f, "  ],\n");

    // Top paths per differential
    fprintf(f, "  topPaths: {\n");
    first = 1;
    for (int d = 0; d < 121; d++) {
        if (path_counts[d] > 0) {
            if (!first) fprintf(f, ",\n");
            fprintf(f, "    \"%d\": [", d - DIFF_OFFSET);
            for (int p = 0; p < path_counts[d]; p++) {
                Path *path = &top_paths[d][p];
                fprintf(f, "{\"o\":[%d", path->outcomes[0]);
                for (int m = 1; m < 10; m++) {
                    fprintf(f, ",%d", path->outcomes[m]);
                }
                fprintf(f, "],\"p\":%.10e,\"vt\":%d,\"ncsu\":%d}",
                        path->probability, path->vt_score, path->ncsu_score);
                if (p < path_counts[d] - 1) fprintf(f, ",");
            }
            fprintf(f, "]");
            first = 0;
        }
    }
    fprintf(f, "\n  },\n");

    // Win probabilities
    fprintf(f, "  vtWin: %.10f,\n", vt_win);
    fprintf(f, "  ncsuWin: %.10f,\n", ncsu_win);
    fprintf(f, "  tie: %.10f\n", tie);

    fprintf(f, "};\n");
    fclose(f);

    printf("\nResults written to wrestling_bruteforce_data.js\n");

    // Print top 10 overall paths
    printf("\n========================================\n");
    printf("TOP 10 MOST LIKELY OUTCOMES\n");
    printf("========================================\n");

    Path all_top[20];
    int all_count = 0;

    for (int d = 0; d < 121; d++) {
        for (int p = 0; p < path_counts[d] && p < 5; p++) {
            if (all_count < 20 || top_paths[d][p].probability > all_top[all_count-1].probability) {
                // Insert sorted
                int insert_pos = all_count < 20 ? all_count : 19;
                for (int i = 0; i < all_count && i < 20; i++) {
                    if (top_paths[d][p].probability > all_top[i].probability) {
                        insert_pos = i;
                        break;
                    }
                }
                if (insert_pos < 20) {
                    for (int i = (all_count < 20 ? all_count : 19); i > insert_pos; i--) {
                        all_top[i] = all_top[i-1];
                    }
                    all_top[insert_pos] = top_paths[d][p];
                    if (all_count < 20) all_count++;
                }
            }
        }
    }

    for (int i = 0; i < 10 && i < all_count; i++) {
        Path *p = &all_top[i];
        printf("%2d. [", i+1);
        for (int m = 0; m < 10; m++) {
            printf("%+d", OUTCOMES[p->outcomes[m]]);
            if (m < 9) printf(" ");
        }
        int diff = p->vt_score - p->ncsu_score;
        const char *winner = diff > 0 ? "VT" : (diff < 0 ? "NCSU" : "TIE");
        printf("] -> %d-%d (%s): %.6f%%\n",
               p->vt_score, p->ncsu_score, winner, p->probability * 100);
    }

    return 0;
}
