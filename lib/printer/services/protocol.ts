// MXW01 Printer Protocol - Command building and parsing

import { crc8 } from "../utils/helpers";

/**
 * MXW01 Printer command identifiers
 */
export const Command = {
  GetStatus: 0xa1,
  SetIntensity: 0xa2,
  PrintRequest: 0xa9,
  FlushData: 0xad,
  PrintComplete: 0xaa,
} as const;

/**
 * Protocol constants
 */
export const PROTOCOL = {
  HEADER_BYTE_1: 0x22,
  HEADER_BYTE_2: 0x21,
  TERMINATOR: 0xff,
} as const;

/**
 * Build a command packet for the MXW01 printer
 * @param command Command identifier
 * @param payload Command payload data
 * @returns Complete command packet with header, payload, CRC, and terminator
 */
export function makeCommand(command: number, payload: Uint8Array): Uint8Array {
  const len = payload.length;
  const header = new Uint8Array([
    PROTOCOL.HEADER_BYTE_1,
    PROTOCOL.HEADER_BYTE_2,
    command,
    0x00,
    len & 0xff,
    (len >> 8) & 0xff,
  ]);

  // Concatenate header and payload
  const cmdWithPayload = new Uint8Array(header.length + payload.length);
  cmdWithPayload.set(header);
  cmdWithPayload.set(payload, header.length);

  // Calculate CRC on payload only
  const crcValue = crc8(payload);

  // Final command: header + payload + CRC + terminator
  const result = new Uint8Array(cmdWithPayload.length + 2);
  result.set(cmdWithPayload);
  result[result.length - 2] = crcValue;
  result[result.length - 1] = PROTOCOL.TERMINATOR;

  return result;
}

/**
 * Parse notification message from printer
 * @param message Raw notification data
 * @returns Parsed command ID and payload, or null if invalid
 */
export function parseNotification(
  message: Uint8Array
): { cmdId: number; payload: Uint8Array } | null {
  // Validate header
  if (
    message[0] !== PROTOCOL.HEADER_BYTE_1 ||
    message[1] !== PROTOCOL.HEADER_BYTE_2
  ) {
    return null;
  }

  const cmdId = message[2];
  const len = message[4] | (message[5] << 8);
  const payload = message.slice(6, 6 + len);

  return { cmdId, payload };
}

