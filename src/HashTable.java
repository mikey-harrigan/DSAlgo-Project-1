import java.util.Arrays;

/**
 * The HashTable class keeps track of Records of seminars,
 * though it does not store the Seminars themselves.
 * 
 * Expansion threshold is 1/2, and double hashing is used.
 * 
 * 
 * @author mikeyh sffisher
 * @version MILESTONE 2
 */
public class HashTable {
    private int size;
    private int numElements;
    Record[] table;

    /**
     * Default constructor creates a Record array filled with null entries
     * 
     * @param initialSize
     *            the initial size of the hash table
     */
    public HashTable(int initialSize) {
        size = initialSize;
        table = new Record[size];
        numElements = 0;
    }


    /**
     * This is the first hash function used.
     * 
     * @param recordKey
     *            the ID / key of a record
     * 
     * @return int
     *         the index to be checked first
     */
    private int h1(int recordKey) {
        return recordKey % size;
    }


    /**
     * This is the second hash function used.
     * That is, it provides the number of indices to step between search
     * attempts.
     * 
     * @param recordKey
     *            the ID / key of a record
     * @return int
     *         the number of indices to step between search attempts
     */
    private int h2(int recordKey) {
        return (((recordKey / size) % (size / 2)) * 2) + 1;
    }


    /**
     * This function expands and re-hashes the HashTable
     */
    private void expand() { // incomplete method
        return;
    }


    /**
     * Searches if the Seminar with [key] ID is in the HashTable
     * 
     * @param key
     *            the ID to be searched
     * @return Record
     *         the Record if it is found
     *         null if it is not found
     */
    public Record search(int key) {

        // First-try index
        int index = h1(key);

        // Keep going until empty slot is found
        while (table[index] != null) {
            // Success if found
            if (table[index].getRecordKey() == key) {
                System.out.println("Successfully inserted record with ID "
                    + key);
                return table[index];
            }

            // Record is not found; iterate index
            index = (index + h2(key)) % size;
        }

        // If not found, print failure message
        System.out.println("Search FAILED -- There is no record with ID "
            + key);
        return null;
    }


    /**
     * Inserts the Record into its appropriate spot in the HashTable
     * using double hashing, and doubling HashTable size if necessary.
     * 
     * @param entry
     *            the Record to be inserted
     * @return boolean
     *         true if success
     *         false if failure
     * 
     */
    public boolean insert(Record entry) {
        // If expand threshold is met, expand the HashTable
        if (this.numElements == size / 2) {
            expand();
        }

        int key = entry.getRecordKey();

        // Start with the first hash function
        int index = h1(key);

        // Keep iterating until an appropriate spot is found
        while (table[index] != null) {
            // Do not allow duplicate entries
            if (table[index].getRecordKey() == key) {
                System.out.println(
                    "Insert FAILED - There is already a record with ID " + key);
                return false;
            }

            // Continue stepping by h2(key) indices
            index = (index + h2(key)) % size;
        }

        // Add this Record into this slot
        table[index] = entry;
        numElements++;

        System.out.println("Successfully inserted record with ID " + key);
        return true;
    }


    /**
     * Removes a Record from the HashTable, setting it to a TOMBSTONE,
     * which essentially is a Record object with an ID of -1.
     * 
     * @param key
     *            the ID of the Record to be removed
     * @return boolean
     *         true if Record is found & removed
     *         false if Record is not found
     */
    public boolean delete(int key) {
        int index = h1(key);

        while (table[index] != null) {
            // Record is found
            if (table[index] == key) {
                table[index].tombstone();
                this.numElements--;

                System.out.println("Record with ID " + key
                    + " successfully deleted from the database");
                return true;
            }
        }

        System.out.println("Delete FAILED -- There is no record with ID "
            + key);
        return false;
    }


    /**
     * Prints the contents of the HashTable in the following format:
     * 
     * Hashtable:
     * 1: 1
     * 2: 2
     * 3: 3
     * 5: 10
     * total records: 4
     * 
     * Note that entries are printed as [index]: [ID]
     */
    public void print() {
        // Header
        System.out.println("Hashtable:");

        for (int i = 0; i < size; i++) {
            // If neither empty nor TOMBSTONE, print line
            if (table[i] != null && table[i].getRecordKey() != -1) {
                System.out.println(i + ": " + table[i].getRecordKey());
            }
        }

        // Footer
        System.out.println("total records: " + numElements);
    }

}
