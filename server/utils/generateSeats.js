/**
 * Seat Generation Helper
 * Automatically creates an array of seat objects based on the total number of seats.
 * Rows are named alphabetically (A, B, C...) and seats are numbered consecutively.
 * 
 * @param {number} totalSeats - Total number of seats to generate
 * @param {number} seatsPerRow - Number of seats per row (default 10)
 * @returns {Array<{seatNumber: string, status: string}>} Array of seat objects
 */
export const generateSeats = (totalSeats, seatsPerRow = 10) => {
  const seats = [];
  const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 0; i < totalSeats; i++) {
    const rowIndex = Math.floor(i / seatsPerRow);
    const seatInRow = (i % seatsPerRow) + 1;
    
    // Supports rows A-Z, then AA, AB if event is very large
    let rowLabel = '';
    if (rowIndex < 26) {
      rowLabel = rows[rowIndex];
    } else {
      const firstLetter = rows[Math.floor(rowIndex / 26) - 1];
      const secondLetter = rows[rowIndex % 26];
      rowLabel = `${firstLetter}${secondLetter}`;
    }

    seats.push({
      seatNumber: `${rowLabel}${seatInRow}`,
      status: 'AVAILABLE'
    });
  }

  return seats;
};

export default generateSeats;
