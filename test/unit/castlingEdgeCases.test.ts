/**
 * Castling edge case tests
 *
 * Covers three scenarios per side (white/black):
 *   1. A square the king must pass through (start/middle/end) is attacked -> no castling
 *   2. A piece sits between king and rook (blocking the rook, not just the king path) -> no castling
 *   3. A normal legal position -> castling must be offered
 *
 * Failure messages are scoped per-scenario (via describe/it names and explicit
 * labels in expect calls) so a failing assertion makes clear which of the three
 * board setups mis-judged O-O / O-O-O.
 */

import { createEmptyBoard, setPiece } from '../../src/core/Board';
import { generateLegalMoves } from '../../src/core/MoveGenerator';
import { Piece, InternalColor, MoveFlag } from '../../src/types';
import { squareToIndex } from '../../src/utils/conversion';

function findCastling(board: ReturnType<typeof createEmptyBoard>, toSquare: string) {
    const moves = generateLegalMoves(board);
    return moves.find(m => (m.flags & MoveFlag.CASTLING) && m.to === squareToIndex(toSquare));
}

describe('Castling Edge Cases', () => {
    describe('White short castling (O-O)', () => {
        it('[middle square attacked] F1 attacked by rook on F8 -> O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('F8'), Piece.BLACK_ROOK); // attacks F1, the king's transit square
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = { whiteShort: true, whiteLong: false, blackShort: false, blackLong: false };

            const castling = findCastling(board, 'G1');
            expect(castling).toBeUndefined();
        });

        it('[rook path blocked] knight sits on G1 between king path end and rook -> O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('G1'), Piece.WHITE_KNIGHT); // occupies a square between king and rook
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = { whiteShort: true, whiteLong: false, blackShort: false, blackLong: false };

            const castling = findCastling(board, 'G1');
            expect(castling).toBeUndefined();
        });

        it('[legal] king/rook untouched, no attacks, empty path -> O-O must be present', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = { whiteShort: true, whiteLong: false, blackShort: false, blackLong: false };

            const castling = findCastling(board, 'G1');
            expect(castling).toBeDefined();
        });
    });

    describe('White long castling (O-O-O)', () => {
        it('[middle square attacked] D1 attacked by rook on D8 -> O-O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('D8'), Piece.BLACK_ROOK); // attacks D1, the king's transit square
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = { whiteShort: false, whiteLong: true, blackShort: false, blackLong: false };

            const castling = findCastling(board, 'C1');
            expect(castling).toBeUndefined();
        });

        it('[rook path blocked] knight sits on B1 (rook path, outside king path) -> O-O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('B1'), Piece.WHITE_KNIGHT); // blocks rook's path, not on king's transit squares
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = { whiteShort: false, whiteLong: true, blackShort: false, blackLong: false };

            const castling = findCastling(board, 'C1');
            expect(castling).toBeUndefined();
        });

        it('[legal] king/rook untouched, no attacks, empty path -> O-O-O must be present', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = { whiteShort: false, whiteLong: true, blackShort: false, blackLong: false };

            const castling = findCastling(board, 'C1');
            expect(castling).toBeDefined();
        });
    });

    describe('Black short castling (O-O)', () => {
        it('[middle square attacked] F8 attacked by rook on F1 -> O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('H8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('F1'), Piece.WHITE_ROOK); // attacks F8
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;
            board.castlingRights = { whiteShort: false, whiteLong: false, blackShort: true, blackLong: false };

            const castling = findCastling(board, 'G8');
            expect(castling).toBeUndefined();
        });

        it('[rook path blocked] bishop sits on G8 between king path end and rook -> O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('H8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('G8'), Piece.BLACK_BISHOP);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;
            board.castlingRights = { whiteShort: false, whiteLong: false, blackShort: true, blackLong: false };

            const castling = findCastling(board, 'G8');
            expect(castling).toBeUndefined();
        });

        it('[legal] king/rook untouched, no attacks, empty path -> O-O must be present', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('H8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;
            board.castlingRights = { whiteShort: false, whiteLong: false, blackShort: true, blackLong: false };

            const castling = findCastling(board, 'G8');
            expect(castling).toBeDefined();
        });
    });

    describe('Black long castling (O-O-O)', () => {
        it('[middle square attacked] D8 attacked by rook on D1 -> O-O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('D1'), Piece.WHITE_ROOK); // attacks D8
            setPiece(board, squareToIndex('H1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;
            board.castlingRights = { whiteShort: false, whiteLong: false, blackShort: false, blackLong: true };

            const castling = findCastling(board, 'C8');
            expect(castling).toBeUndefined();
        });

        it('[rook path blocked] bishop sits on B8 (rook path, outside king path) -> O-O-O must be absent', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('B8'), Piece.BLACK_BISHOP);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;
            board.castlingRights = { whiteShort: false, whiteLong: false, blackShort: false, blackLong: true };

            const castling = findCastling(board, 'C8');
            expect(castling).toBeUndefined();
        });

        it('[legal] king/rook untouched, no attacks, empty path -> O-O-O must be present', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;
            board.castlingRights = { whiteShort: false, whiteLong: false, blackShort: false, blackLong: true };

            const castling = findCastling(board, 'C8');
            expect(castling).toBeDefined();
        });
    });
});
