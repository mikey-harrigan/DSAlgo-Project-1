import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

/**
 * The CommandProcessor opens and parses a file it is given.
 * 
 * It calls SeminarDB for the input of Seminar data.
 * 
 * @author mikeyh sffisher
 * @version MILESTONE 2
 *
 */
public class CommandProcessor {

    /**
     * Default constructor is called by SemManager.
     * 
     * @param database
     *            the SeminarDB that is handling this data
     * @param input_filename
     *            the filename of the input file
     */
    public CommandProcessor(SeminarDB database, String input_filename)
        throws FileNotFoundException {

        // This object scans the file line-by-line
        Scanner scan = new Scanner(new File(input_filename));

        while (scan.hasNextLine()) {
            String this_line = scan.nextLine();

            // this_line is a buffer line if it is only whitespace
            if (this_line.replaceAll("\\s", "") == "") {
                continue;
            }

            // Identify the type of command
            String command = this_line.substring(0, this_line.indexOf(" "));

            // Handles the insert command
            if (command.equals("insert")) {
                // This is the Seminar data to be parsed
                int id, length, cost = 0;
                String title, description, date = "";
                short x_coord, y_coord = 0;
                String[] keywords;

                // Parse first two lines of command
                id = Integer.parseInt(this_line.substring(6).trim());
                title = scan.nextLine();

                // Parse third line of command
                // Note: this line contains 5 different data
                String[] complex_line = scan.nextLine().split("\\s+");
                date = complex_line[0];
                length = Integer.parseInt(complex_line[1]);
                x_coord = (short)Integer.parseInt(complex_line[2]);
                y_coord = (short)Integer.parseInt(complex_line[3]);
                cost = Integer.parseInt(complex_line[4]);

                // Parse final two lines of command
                keywords = scan.nextLine().split("\\s+");
                description = scan.nextLine().trim();

                // Call SeminarDB's insert command using these data
                if (!(database.insert(id, title, date, length, x_coord, y_coord,
                    cost, keywords, description))) {
                    // Error if repeat ID attempts insert
                    System.out.println("Insert failed due to repeat ID.");
                }
            }
            
            // Handles the "delete" command
            if (command.equals("delete")) {
                int id = Integer.parseInt(this_line.substring(6).trim());
                
                // Call SeminarDB's delete command
                if (!(database.delete(id))) {
                    // Error if ID is not in database
                    System.out.println("Delete failed due to missing ID.");
                }
            }
            
            // Handles the "search" command
            if (command.equals("search")) {
                
            }
            
            // Handles the "print hashtable" command
            if (command.equals("print hashtable")) {
                
            }
            
            // Handles the "print blocks" command
            if (command.equals("print blocks")) {
                
            }
        }
    }
}
