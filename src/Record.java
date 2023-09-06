

public class Record {
    /**
     * the ID of the seminar object
     */
    int recordKey;
    /**
     * the starting Byte location in the memory pool
     */
    int startByte;
    /**
     * the byte length of the seminar in the memory pool
     */
    int recordLength;
    /**
     * constructor of the record object,
     * @param seminar the seminar for which the record is storing the 
     * memory location of 
     */
    public Record(int id)
    {
        // the ID of a seminar record
        recordKey = id;
        startByte = 0;
        recordLength = 0;
        
    }
    /**
     * getter method for the recordKey
     * @return the key for the record
     */
    public int getRecordKey()
    {
        return recordKey;
    }
    
    /**
     * setter for the recordKey
     * @param newKey the new recordKey value
     */
    public void setRecordKey(int newKey)
    {
        recordKey = newKey;
    }
    public void printRecord()
    {
     System.out.println(this.getRecordKey());   
    }
}
