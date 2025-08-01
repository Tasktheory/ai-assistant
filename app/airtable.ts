// Minimal Airtable module stub for Next.js API

export type AirtableRecord = {
  name: string;
  info: string;
};

// Replace this with real Airtable API integration as needed
export async function fetchAirtableData(): Promise<AirtableRecord[]> {
  // Example static data; replace with actual fetch logic
  return [
    { name: 'Sample Record 1', info: 'This is a sample Airtable record.' },
    { name: 'Sample Record 2', info: 'Another example record.' },
  ];
}
