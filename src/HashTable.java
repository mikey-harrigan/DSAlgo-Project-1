import java.util.Arrays;

/*
 * class that stores the hash table data structure and functionalities.
 * will create an Array of Record Objects which include a Key for that record
 * and a handle that points to the Seminar Data in the memory pool.
 * 
 */
public class HashTable {

    // the current size of the hash table
    private int hashTableSize;
    // the number current open slots in the hash table
    private int openSlots;
    Record[] table;

    /**
     * constructor for the hash table, is initialized to the size
     * specified in the command line argument read in SemManager.
     * initializes an array of Record objects which store the key, and handle
     * of a Seminar Object. hashTablesize and openSlots are both initialized to
     * initialSize of table.
     * 
     * @param initialSize
     *            the initial size of the hash table specified in seminar
     *            manager
     */
    public HashTable(int initialSize) {
        table = new Record[initialSize];// creates new Array of Record objects
        // all slots initialized to null
        hashTableSize = initialSize;
        openSlots = initialSize;

    }


    /**
     * creates the key associated with a Seminar Object ID
     * 
     * @param recordKey
     *            The key associated with a record object
     * @return The index associated with the record key
     */
    public int hashFunction(int recordKey) {
        return recordKey % hashTableSize;
    }


    /**
     * second has function that creates a key associated with a seminar object
     * ID
     * 
     * @param the
     *            key associated with a Record object
     * @return the index associated with the record key
     */
    public int hashFunction2(int recordKey) {
        return (((recordKey / hashTableSize) % (hashTableSize / 2)) * 2) + 1;
    }


    /**
     * used to double the size of a hash table once it meets
     * 50% capacity
     * 
     * @return new rehashed table
     */
    public HashTable doubleSize() { // incomplete method
        return null;
    }


    /**
     * returns Record object at given index in the Table
     * 
     * @param index
     * @return
     */
    public Record retrieveRecord(int index) {
        if (table[index] == null) {
            return null;
        }
        else {
            return table[index];
        }
    }
    


    /**
     * insert method for HashTable
     * 
     * @param seminar
     *            will take a seminar, create a Record Object
     *            using the seminar and add it to the hash table
     * @return boolean true if add was successful.
     * 
     */
    public boolean insert(Seminar seminar) { // incomplete method
        int id = seminar.getID();
        int index = hashFunction(id);
        if (openSlots <= hashTableSize / 2) {
            doubleSize();
            insert(seminar);
        }
        else if (retrieveRecord(index) == null) {
            Record record = new Record(seminar);
            table[index] = record;
            openSlots--;
            return true;
        }
        else if (retrieveRecord(index) != null) {
            while (retrieveRecord(index) != null) 
            {
                index = index + hashFunction2(id);
            }
            Record record = new Record(seminar);
            table[index] = record;
            openSlots--;
            return true;
        }
        return false;
        

    }
}
