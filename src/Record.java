

public class Record {
    
    int recordID;
    int recordKey;
    int startByte;
    int recordLength;
    public Record(Seminar seminar)
    {
        recordID = seminar.getID();
        recordKey = 0;
        startByte = 0;
        recordLength = 0;
        
    }
    
    public int getRecordID()
    {
        return recordID;
    }
    
    public int getRecordKey()
    {
        return recordKey;
    }
    
    public void setRecordKey(int newKey)
    {
        recordKey = newKey;
    }
}
