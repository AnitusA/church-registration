import { supabase } from './supabase.client';

/**
 * Generates a globally unique participant ID based on role and section
 * @param role - "teacher" or "student"
 * @param section - section name for students (ignored for teachers)
 * @returns Promise<string> - The generated unique participant ID
 */
export async function generateUniqueParticipantId(role: string, section?: string): Promise<string> {
  // Determine the prefix based on role and section
  let prefix: string;
  if (role === "teacher") {
    prefix = "T";
  } else if (section) {
    prefix = section[0].toUpperCase(); // First letter of section (N, B, P, J, S)
  } else {
    prefix = "S"; // Default student prefix
  }

  try {
    // Get all existing participant IDs with the same prefix from the database
    const { data: existingParticipants, error } = await supabase
      .from("participants")
      .select("participant_id")
      .like("participant_id", `${prefix}%`);

    if (error) {
      console.error("Error fetching existing participant IDs:", error);
      // Fallback to a random number if database query fails
      return `${prefix}${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
    }

    // Extract numbers from existing IDs with the same prefix
    const existingNumbers = (existingParticipants || [])
      .map(p => p.participant_id)
      .filter(id => id.startsWith(prefix) && id.length === 4) // Ensure format is correct (e.g., T001, N001)
      .map(id => parseInt(id.slice(1))) // Extract number part
      .filter(num => !isNaN(num)) // Filter out invalid numbers
      .sort((a, b) => a - b); // Sort numerically

    // Find the next available number
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else if (num > nextNumber) {
        break; // Found a gap
      }
    }

    // Return the formatted ID
    return `${prefix}${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error in generateUniqueParticipantId:", error);
    // Fallback to a random number if any error occurs
    return `${prefix}${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
  }
}

/**
 * Checks if a participant ID should be updated based on role/section changes
 * @param currentId - Current participant ID
 * @param newRole - New role
 * @param newSection - New section (for students)
 * @returns boolean - True if ID needs to be updated
 */
export function shouldUpdateParticipantId(currentId: string, newRole: string, newSection?: string): boolean {
  if (!currentId || currentId.length !== 4) return true; // Invalid current ID

  const currentPrefix = currentId[0];
  
  // Determine what the new prefix should be
  let expectedPrefix: string;
  if (newRole === "teacher") {
    expectedPrefix = "T";
  } else if (newSection) {
    expectedPrefix = newSection[0].toUpperCase();
  } else {
    expectedPrefix = "S"; // Default student prefix
  }

  // Return true if the prefix needs to change
  return currentPrefix !== expectedPrefix;
}
