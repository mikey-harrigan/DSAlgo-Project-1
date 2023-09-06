/**
 * The SeminarDB is called for input and retrieval
 * of Seminar data. It also handles the storage of this data.
 * 
 * Actual memory storage is done with the help of a MemManager,
 * while location tracking is done by a HashTable and Handles.
 * 
 * @author mikeyh sffisher
 * @version MILESTONE 2
 *
 */
public class SeminarDB {
    private HashTable hash;
    private MemoryManager mem;

    /**
     * Default constructor is called by SemManager
     * 
     * @param memory_size
     *            the size of the MemoryManager array
     * @param hashtable_size
     *            the size of the HashTable
     */
    public SeminarDB(int memory_size, int hashtable_size) {
        hash = new HashTable(hashtable_size);
        mem = new MemoryManager(memory_size);
    }


    public void command_insert(
        int id,
        String title,
        String date,
        int length,
        short x_coord,
        short y_coord,
        int cost,
        String[] keywords,
        String description) {
        
    }


    public void command_delete(int id) {

    }


    public void command_search(int id) {

    }


    public void command_phash() {

    }


    public void command_pblocks() {

    }
}
