// app/api/airtable.ts

export interface AirtableRecord {
  info: string;
  name: string;
  id: string;
  fields: {
    name: string;
    info: string;
    // Add more fields as needed
  };
  createdTime?: string;
}

export async function fetchAirtableData(): Promise<AirtableRecord[]> {
  // This is just dummy placeholder data
  return [
    {
      id: "rec123",
      fields: {
        name: "Example Record",
        info: "This is some example info"
      },
      createdTime: new Date().toISOString(),
      info: "",
      name: ""
    }
  ];
}
