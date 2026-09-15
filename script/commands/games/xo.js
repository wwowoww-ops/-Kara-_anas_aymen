"use strict";

const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "اكسو",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "لعبة إكس أو بالصورة",
    commandCategory: "Games",
    usages: "اكسو | اكس او | xo",
    cooldowns: 2
};

// ==================================================
// إعدادات
// ==================================================

const games = new Map();

const CACHE_DIR = path.join(__dirname, "cache");

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, {
        recursive: true
    });
}

// ==================================================
// الكلمات المقبولة
// ==================================================

const COMMAND_ALIASES = [
    "اكسو",
    "اكس او",
    "اكس-او",
    "xo",
    "x o"
];

// ==================================================
// الأرقام
// ==================================================

const DIGITS = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
];

// ==================================================
// معرفة هل النص حركة
// ==================================================

function getMove(text) {

    if (!text) return null;

    const value = String(text)
        .trim()
        .toLowerCase();

    if (!DIGITS.includes(value)) {
        return null;
    }

    return Number(value) - 1;
}

// ==================================================
// إنشاء لوحة فارغة
// ==================================================

function createBoard() {
    return [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ];
}

// ==================================================
// التحقق من الفوز
// ==================================================

function checkWinner(board) {

    const combinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const combo of combinations) {

        const [a, b, c] = combo;

        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return {
                winner: board[a],
                line: combo
            };
        }
    }

    if (board.every(cell => cell !== "")) {
        return {
            winner: "draw",
            line: []
        };
    }

    return null;
}

// ==================================================
// الحركات المتاحة
// ==================================================

function getAvailableMoves(board) {

    const moves = [];

    for (let i = 0; i < board.length; i++) {

        if (!board[i]) {
            moves.push(i);
        }
    }

    return moves;
}

// ==================================================
// حركة البوت
// ==================================================

function botMove(board) {

    const available = getAvailableMoves(board);

    if (!available.length) {
        return null;
    }

    // أولاً يحاول الفوز
    for (const move of available) {

        const testBoard = [...board];

        testBoard[move] = "O";

        const result = checkWinner(testBoard);

        if (result && result.winner === "O") {
            return move;
        }
    }

    // يمنع اللاعب من الفوز
    for (const move of available) {

        const testBoard = [...board];

        testBoard[move] = "X";

        const result = checkWinner(testBoard);

        if (result && result.winner === "X") {
            return move;
        }
    }

    // يفضل المنتصف
    if (board[4] === "") {
        return 4;
    }

    // الزوايا
    const corners = [0, 2, 6, 8]
        .filter(index => board[index] === "");

    if (corners.length) {
        return corners[
            Math.floor(Math.random() * corners.length)
        ];
    }

    // أي خانة متاحة
    return available[
        Math.floor(Math.random() * available.length)
    ];
}

// ==================================================
// تحميل الخط
// ==================================================

async function loadFont() {

    try {
        return await Jimp.loadFont(
            Jimp.FONT_SANS_32_WHITE
        );
    } catch (error) {
        return null;
    }
}

// ==================================================
// إنشاء صورة اللعبة
// ==================================================

async function createGameImage(game) {

    const width = 900;
    const height = 1050;

    const image = new Jimp(
        width,
        height,
        0x11111FFF
    );

    const font = await loadFont();

    // ----------------------------------------------
    // العنوان
    // ----------------------------------------------

    if (font) {

        image.print(
            font,
            0,
            35,
            {
                text: "HINA XO",
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            width,
            60
        );

        image.print(
            font,
            0,
            105,
            {
                text:
                    game.mode === "bot"
                        ? `${game.playerName}  X   ضد   HINA  O`
                        : `${game.playerName}  X   ضد   ${game.opponentName}  O`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            width,
            50
        );
    }

    // ----------------------------------------------
    // أبعاد اللوحة
    // ----------------------------------------------

    const boardSize = 720;

    const startX =
        Math.floor((width - boardSize) / 2);

    const startY = 210;

    const cellSize =
        Math.floor(boardSize / 3);

    // ----------------------------------------------
    // رسم الخلفية
    // ----------------------------------------------

    const boardBackground = new Jimp(
        boardSize,
        boardSize,
        0x1C1C2BFF
    );

    image.composite(
        boardBackground,
        startX,
        startY
    );

    // ----------------------------------------------
    // رسم الخطوط
    // ----------------------------------------------

    const lineColor = 0x8A5CFFFF;

    for (let i = 1; i < 3; i++) {

        const x =
            startX + i * cellSize;

        const verticalLine = new Jimp(
            8,
            boardSize,
            lineColor
        );

        image.composite(
            verticalLine,
            x - 4,
            startY
        );

        const y =
            startY + i * cellSize;

        const horizontalLine = new Jimp(
            boardSize,
            8,
            lineColor
        );

        image.composite(
            horizontalLine,
            startX,
            y - 4
        );
    }

    // ----------------------------------------------
    // رسم X و O
    // ----------------------------------------------

    const symbolFont = await Jimp.loadFont(
        Jimp.FONT_SANS_128_WHITE
    );

    for (let i = 0; i < 9; i++) {

        const value = game.board[i];

        if (!value) {

            // رقم الخانة
            if (font) {

                const number =
                    String(i + 1);

                const col = i % 3;
                const row = Math.floor(i / 3);

                const cellX =
                    startX +
                    col * cellSize;

                const cellY =
                    startY +
                    row * cellSize;

                image.print(
                    font,
                    cellX,
                    cellY,
                    {
                        text: number,
                        alignmentX:
                            Jimp.HORIZONTAL_ALIGN_CENTER,
                        alignmentY:
                            Jimp.VERTICAL_ALIGN_MIDDLE
                    },
                    cellSize,
                    cellSize
                );
            }

            continue;
        }

        const col = i % 3;
        const row = Math.floor(i / 3);

        const cellX =
            startX +
            col * cellSize;

        const cellY =
            startY +
            row * cellSize;

        image.print(
            symbolFont,
            cellX,
            cellY,
            {
                text: value,
                alignmentX:
                    Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY:
                    Jimp.VERTICAL_ALIGN_MIDDLE
            },
            cellSize,
            cellSize
        );
    }

    // ----------------------------------------------
    // النص السفلي
    // ----------------------------------------------

    if (font) {

        let status;

        if (game.finished) {

            if (game.result === "draw") {
                status = "تعادل";
            } else if (game.result === "player") {
                status = `الفائز: ${game.playerName}`;
            } else {
                status = "HINA فازت";
            }

        } else {

            status =
                game.turn === "X"
                    ? `الدور: ${game.playerName}`
                    : game.mode === "bot"
                        ? "الدور: HINA"
                        : `الدور: ${game.opponentName}`;
        }

        image.print(
            font,
            0,
            955,
            {
                text: status,
                alignmentX:
                    Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY:
                    Jimp.VERTICAL_ALIGN_MIDDLE
            },
            width,
            55
        );
    }

    const fileName =
        `xo_${game.threadID}_${game.playerID}_${Date.now()}.png`;

    const outputPath =
        path.join(CACHE_DIR, fileName);

    await image
        .quality(100)
        .writeAsync(outputPath);

    return outputPath;
}

// ==================================================
// حذف الصورة
// ==================================================

function deleteFile(filePath) {

    try {

        if (
            filePath &&
            fs.existsSync(filePath)
        ) {
            fs.unlinkSync(filePath);
        }

    } catch (error) {}
}

// ==================================================
// إرسال اللوحة
// ==================================================

async function sendBoard(
    api,
    threadID,
    game,
    replyTo
) {

    const imagePath =
        await createGameImage(game);

    return new Promise((resolve) => {

        api.sendMessage(
            {
                body:
                    game.finished
                        ? "انتهت اللعبة"
                        : "اختر رقم الخانة من الصورة",
                attachment:
                    fs.createReadStream(imagePath)
            },
            threadID,
            (error) => {

                deleteFile(imagePath);

                resolve();
            },
            replyTo
        );
    });
}

// ==================================================
// بدء لعبة
// ==================================================

async function startGame({
    api,
    event,
    opponentID,
    opponentName,
    mode
}) {

    const {
        threadID,
        senderID
    } = event;

    const key =
        `${threadID}:${senderID}`;

    if (games.has(key)) {

        return api.sendMessage(
            "لديك لعبة XO جارية بالفعل",
            threadID
        );
    }

    const game = {

        threadID,

        playerID:
            senderID,

        playerName:
            event.senderName ||
            "اللاعب",

        opponentID,

        opponentName:
            opponentName ||
            "HINA",

        mode,

        board:
            createBoard(),

        turn: "X",

        finished: false,

        result: null
    };

    games.set(key, game);

    await sendBoard(
        api,
        threadID,
        game,
        event.messageID
    );
}

// ==================================================
// تنفيذ الحركة
// ==================================================

async function playMove({
    api,
    event,
    game,
    move
}) {

    if (
        game.finished ||
        game.turn !== "X"
    ) {
        return;
    }

    if (
        move === null ||
        game.board[move]
    ) {

        return api.sendMessage(
            "هذه الخانة غير متاحة اختر خانة أخرى",
            event.threadID
        );
    }

    game.board[move] = "X";

    let result =
        checkWinner(game.board);

    if (result) {

        finishGame(
            game,
            result,
            "player"
        );

        await sendBoard(
            api,
            event.threadID,
            game,
            event.messageID
        );

        games.delete(
            `${game.threadID}:${game.playerID}`
        );

        return;
    }

    // ----------------------------------------------
    // البوت
    // ----------------------------------------------

    if (game.mode === "bot") {

        game.turn = "O";

        const botMoveIndex =
            botMove(game.board);

        if (botMoveIndex !== null) {

            game.board[botMoveIndex] = "O";
        }

        result =
            checkWinner(game.board);

        if (result) {

            finishGame(
                game,
                result,
                result.winner === "O"
                    ? "bot"
                    : "draw"
            );

            await sendBoard(
                api,
                event.threadID,
                game,
                event.messageID
            );

            games.delete(
                `${game.threadID}:${game.playerID}`
            );

            return;
        }

        game.turn = "X";
    }

    // ----------------------------------------------
    // ضد لاعب
    // ----------------------------------------------

    else {

        game.turn = "O";
    }

    await sendBoard(
        api,
        event.threadID,
        game,
        event.messageID
    );
}

// ==================================================
// إنهاء اللعبة
// ==================================================

function finishGame(
    game,
    result,
    winnerType
) {

    game.finished = true;

    if (result.winner === "draw") {

        game.result = "draw";

        return;
    }

    if (winnerType === "player") {

        game.result = "player";

        return;
    }

    game.result = "bot";
}

// ==================================================
// التعامل مع حركة الخصم
// ==================================================

async function playOpponentMove({
    api,
    event,
    game,
    move
}) {

    if (
        game.finished ||
        game.mode !== "player"
    ) {
        return;
    }

    if (game.turn !== "O") {
        return;
    }

    if (
        move === null ||
        game.board[move]
    ) {

        return api.sendMessage(
            "هذه الخانة غير متاحة اختر خانة أخرى",
            event.threadID
        );
    }

    game.board[move] = "O";

    const result =
        checkWinner(game.board);

    if (result) {

        finishGame(
            game,
            result,
            result.winner === "O"
                ? "opponent"
                : "draw"
        );

        await sendBoard(
            api,
            event.threadID,
            game,
            event.messageID
        );

        games.delete(
            `${game.threadID}:${game.playerID}`
        );

        return;
    }

    game.turn = "X";

    await sendBoard(
        api,
        event.threadID,
        game,
        event.messageID
    );
}

// ==================================================
// الأمر الرئيسي
// ==================================================

module.exports.run = async function ({
    api,
    event,
    args
}) {

    const {
        threadID,
        senderID,
        messageID,
        type,
        messageReply
    } = event;

    // ----------------------------------------------
    // إذا كانت هناك لعبة جارية
    // ----------------------------------------------

    const key =
        `${threadID}:${senderID}`;

    const existingGame =
        games.get(key);

    if (existingGame) {

        const move =
            getMove(
                args &&
                args.length
                    ? args[0]
                    : ""
            );

        if (move === null) {

            return api.sendMessage(
                "اللعبة جارية أرسل رقم الخانة من 1 إلى 9",
                threadID
            );
        }

        if (
            existingGame.mode === "player" &&
            existingGame.turn === "O"
        ) {

            return playOpponentMove({
                api,
                event,
                game: existingGame,
                move
            });
        }

        return playMove({
            api,
            event,
            game: existingGame,
            move
        });
    }

    // ----------------------------------------------
    // بدء لعبة جديدة
    // ----------------------------------------------

    let opponentID = null;
    let opponentName = null;
    let mode = "bot";

    if (
        type === "message_reply" &&
        messageReply &&
        messageReply.senderID
    ) {

        opponentID =
            messageReply.senderID;

        // لا يسمح بتحدي نفسه
        if (opponentID === senderID) {

            return api.sendMessage(
                "لا يمكنك لعب XO ضد نفسك",
                threadID
            );
        }

        // محاولة الحصول على اسم الخصم
        try {

            const info =
                await api.getUserInfo(
                    opponentID
                );

            if (
                info &&
                info[opponentID]
            ) {
                opponentName =
                    info[opponentID].name;
            }

        } catch (error) {}

        mode = "player";
    }

    await startGame({
        api,
        event,
        opponentID,
        opponentName,
        mode
    });
};