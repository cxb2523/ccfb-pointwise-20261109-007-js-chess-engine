/**
 * En passant edge case tests
 *
 * En passant legality must be derived from "what the last move actually was"
 * (which piece, from which square, to which square) rather than from rank/file
 * deltas alone. These tests drive real move history through applyMoveComplete
 * so board.enPassantSquare reflects a genuine last move, then assert whether
 * the en passant capture is offered.
 *
 * Three scenarios per color:
 *   1. [just double-pushed] enemy pawn double-pushed last move, adjacent to our pawn -> EP available
 *   2. [stale] enemy pawn double-pushed two moves ago (an intervening move happened) -> EP not available
 *   3. [single step] enemy pawn reached the adjacent square via two single pushes, not a double push -> EP not available
 *
 * Failure messages are scoped per-scenario (via describe/it names) so a failing
 * assertion makes clear which of the three board/move-history setups mis-judged
 * the en passant capture.
 */

import { createEmptyBoard, setPiece } from '../../src/core/Board';
import { generateLegalMoves, applyMoveComplete } from '../../src/core/MoveGenerator';
import { Piece, InternalColor, MoveFlag, InternalMove } from '../../src/types';
import { squareToIndex } from '../../src/utils/conversion';

function move(from: string, to: string, piece: Piece, flags: MoveFlag, capturedPiece: Piece = Piece.EMPTY): InternalMove {
    return {
        from: squareToIndex(from),
        to: squareToIndex(to),
        piece,
        capturedPiece,
        flags,
    };
}

function findEnPassant(board: ReturnType<typeof createEmptyBoard>, toSquare: string) {
    const moves = generateLegalMoves(board);
    return moves.find(m => (m.flags & MoveFlag.EN_PASSANT) && m.to === squareToIndex(toSquare));
}

describe('En Passant Edge Cases', () => {
    describe('White pawn capturing en passant', () => {
        it('[just double-pushed] black pawn D7-D5 last move, white pawn on E5 -> EP to D6 available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D7'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.BLACK;

            // Black plays D7-D5 (double push) — this is the move immediately preceding White's turn.
            applyMoveComplete(board, move('D7', 'D5', Piece.BLACK_PAWN, MoveFlag.PAWN_DOUBLE_PUSH));

            expect(board.enPassantSquare).toBe(squareToIndex('D6'));
            const ep = findEnPassant(board, 'D6');
            expect(ep).toBeDefined();
        });

        it('[stale] black pawn double-pushed two moves ago, an intervening move happened -> EP to D6 not available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D7'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            board.turn = InternalColor.BLACK;

            // Black plays D7-D5 (double push): EP square set to D6.
            applyMoveComplete(board, move('D7', 'D5', Piece.BLACK_PAWN, MoveFlag.PAWN_DOUBLE_PUSH));
            expect(board.enPassantSquare).toBe(squareToIndex('D6'));

            // White does not capture en passant immediately; plays a quiet king move instead.
            applyMoveComplete(board, move('A1', 'A2', Piece.WHITE_KING, MoveFlag.NONE));
            // The opportunity must have been cleared by the intervening move.
            expect(board.enPassantSquare).toBeNull();

            // Black plays an unrelated quiet move (king shuffles), still not touching D-file.
            applyMoveComplete(board, move('H8', 'H7', Piece.BLACK_KING, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            // Now it's White's turn again; the D5 pawn has been sitting there for a full move already.
            const ep = findEnPassant(board, 'D6');
            expect(ep).toBeUndefined();
        });

        it('[single step] black pawn reaches D5 via two single pushes (D7-D6, D6-D5) -> EP to D6 not available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D7'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            board.turn = InternalColor.BLACK;

            // Black plays D7-D6 (single push, NOT a double push).
            applyMoveComplete(board, move('D7', 'D6', Piece.BLACK_PAWN, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            // White plays a quiet move.
            applyMoveComplete(board, move('A1', 'A2', Piece.WHITE_KING, MoveFlag.NONE));

            // Black plays D6-D5 (single push again) — pawn ends up adjacent to the white
            // pawn on E5 with the same board geometry as a double push, but it is NOT one.
            applyMoveComplete(board, move('D6', 'D5', Piece.BLACK_PAWN, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            // Rank/file deltas alone would make this look identical to a double push;
            // the engine must rely on actual move-history (no PAWN_DOUBLE_PUSH flag was set).
            const ep = findEnPassant(board, 'D6');
            expect(ep).toBeUndefined();
        });
    });

    describe('Black pawn capturing en passant', () => {
        it('[just double-pushed] white pawn D2-D4 last move, black pawn on E4 -> EP to D3 available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('D2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            // White plays D2-D4 (double push) — immediately preceding Black's turn.
            applyMoveComplete(board, move('D2', 'D4', Piece.WHITE_PAWN, MoveFlag.PAWN_DOUBLE_PUSH));

            expect(board.enPassantSquare).toBe(squareToIndex('D3'));
            const ep = findEnPassant(board, 'D3');
            expect(ep).toBeDefined();
        });

        it('[stale] white pawn double-pushed two moves ago, an intervening move happened -> EP to D3 not available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('D2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            // White plays D2-D4 (double push): EP square set to D3.
            applyMoveComplete(board, move('D2', 'D4', Piece.WHITE_PAWN, MoveFlag.PAWN_DOUBLE_PUSH));
            expect(board.enPassantSquare).toBe(squareToIndex('D3'));

            // Black does not capture en passant immediately; plays a quiet king move instead.
            applyMoveComplete(board, move('A8', 'A7', Piece.BLACK_KING, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            // White plays an unrelated quiet move.
            applyMoveComplete(board, move('H1', 'H2', Piece.WHITE_KING, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            const ep = findEnPassant(board, 'D3');
            expect(ep).toBeUndefined();
        });

        it('[single step] white pawn reaches D4 via two single pushes (D2-D3, D3-D4) -> EP to D3 not available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('D2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            // White plays D2-D3 (single push, NOT a double push).
            applyMoveComplete(board, move('D2', 'D3', Piece.WHITE_PAWN, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            // Black plays a quiet move.
            applyMoveComplete(board, move('A8', 'A7', Piece.BLACK_KING, MoveFlag.NONE));

            // White plays D3-D4 (single push again) — same final geometry as a double push,
            // but the move history shows two single steps, not one PAWN_DOUBLE_PUSH move.
            applyMoveComplete(board, move('D3', 'D4', Piece.WHITE_PAWN, MoveFlag.NONE));
            expect(board.enPassantSquare).toBeNull();

            const ep = findEnPassant(board, 'D3');
            expect(ep).toBeUndefined();
        });
    });
});
