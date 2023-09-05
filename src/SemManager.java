
/**
 * This project handles storage of information about seminars.
 * Memory is stored in an array of bytes, with tracking handled
 * by HT.
 */

/**
 * The class containing the main method.
 *
 * @author mikeyh sffisher
 * @version MILESTONE 2
 */

// On my honor:
// - I have not used source code obtained from another current or
// former student, or any other unauthorized source, either
// modified or unmodified.
//
// - All source code and documentation used in my program is
// either my original work, or was derived by me from the
// source code published in the textbook for this course.
//
// - I have not discussed coding details about this project with
// anyone other than my partner (in the case of a joint
// submission), instructor, ACM/UPE tutors or the TAs assigned
// to this course. I understand that I may discuss the concepts
// of this program with other students, and that another student
// may help me debug my program so long as neither of us writes
// anything during the discussion or modifies any computer file
// during the discussion. I have violated neither the spirit nor
// letter of this restriction.

public class SemManager {
    /**
     * Begins program to handle input, storage, and retrieval of
     * information pertaining to Seminars.
     * 
     * Initializes the database and passes it to CommandProcessor,
     * which itself does the input and retrieval.
     * 
     * @param args
     *            Command line arguments
     *            [mem_size, hash_size, command_file]
     */
    public static void main(String[] args) {
        int mem_size = Integer.parseInt(args[0]);
        int hash_size = Integer.parseInt(args[1]);
        String command_file = args[2];

        // Check invalid mem_size argument
        if (mem_size <= 0 ||
        // Returns invalid if mem_size is not a power of two
            !((mem_size & -mem_size) == mem_size)) {
            System.out.println("ERROR: Invalid memory size.");
            return;
        }
        // Check invalid hash_size argument
        if (hash_size <= 0 ||
        // Returns invalid if hash_size is not a power of two
            !((hash_size & -hash_size) == hash_size)) {
            System.out.println("ERROR: Invalid hash size.");
            return;
        }

        SeminarDB database = new SeminarDB(mem_size, hash_size);
        CommandProcessor processor = new CommandProcessor(database,
            command_file);
    }
}
