const fs = require("fs");
const path = require("path");
const os = require("os");
const {
    createCanvas,
    GlobalFonts
} = require("@napi-rs/canvas");

// ==================================================
// الإعدادات
// ==================================================

module.exports.config = {
    name: "اكسو",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "لعبة XO بصورة تفاعلية",
    commandCategory: "games",
    usages: "اكسو",
    cooldowns: 3
};

// ==================================================
// الخط العربي
// ==================================================

const possibleFonts = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansArabic-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansArabic-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansArabicUI-Regular.ttf",
    "/system/fonts/NotoNaskhArabic-Regular.ttf",
    "/system/fonts/NotoSansArabic-Regular.ttf"
];

for (const font of possibleFonts) {
    try {
        if (fs.existsSync(font)) {
            GlobalFonts.registerFromPath(font, "HINA");
        }
    } catch {}
}

// ==================================================
// الألعاب
// ==================================================

const games = new Map();

// ==================================================
// أدوات
// ==================================================

function createGameID() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10)
    );
}

function cleanName(name, fallback = "لاعب") {
    if (!name) return fallback;

    return String(name)
        .replace(/[<>]/g, "")
        .slice(0, 18);
}

function getName(event) {
    return cleanName(
        event.senderName ||
        event.name ||
        "لاعب"
    );
}

// ==================================================
// إنشاء اللعبة
// ==================================================

function createGame({
    threadID,
    player1ID,
    player1Name,
    player2ID = null,
    player2Name = "HINA",
    vsBot = false
}) {
    const gameID = createGameID();

    const game = {
        id: gameID,
        threadID: String(threadID),

        player1: {
            id: String(player1ID),
            name: cleanName(player1Name, "اللاعب"),
            symbol: "X"
        },

        player2: {
            id: player2ID
                ? String(player2ID)
                : null,
            name: cleanName(player2Name, "HINA"),
            symbol: "O"
        },

        vsBot,

        board: [
            null, null, null,
            null, null, null,
            null, null, null
        ],

        turn: "X",
        status: "playing",

        boardMessageID: null
    };

    games.set(gameID, game);

    return game;
}

// ==================================================
// الفائز
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

    for (const [a, b, c] of combinations) {
        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return {
                winner: board[a],
                cells: [a, b, c]
            };
        }
    }

    if (board.every(Boolean)) {
        return {
            winner: "draw",
            cells: []
        };
    }

    return null;
}

// ==================================================
// حركات البوت
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

function findWinningMove(board, symbol) {
    const moves = getAvailableMoves(board);

    for (const move of moves) {
        const test = [...board];
        test[move] = symbol;

        const result = checkWinner(test);

        if (result && result.winner === symbol) {
            return move;
        }
    }

    return null;
}

function botMove(board) {
    const available = getAvailableMoves(board);

    if (!available.length) {
        return null;
    }

    // الفوز
    const winningMove = findWinningMove(
        board,
        "O"
    );

    if (winningMove !== null) {
        return winningMove;
    }

    // منع اللاعب من الفوز
    const blockingMove = findWinningMove(
        board,
        "X"
    );

    if (blockingMove !== null) {
        return blockingMove;
    }

    // المركز
    if (!board[4]) {
        return 4;
    }

    // الزوايا
    const corners = [
        0,
        2,
        6,
        8
    ].filter(index => !board[index]);

    if (corners.length) {
        return corners[
            Math.floor(
                Math.random() * corners.length
            )
        ];
    }

    // أي خانة متاحة
    return available[
        Math.floor(
            Math.random() * available.length
        )
    ];
}

// ==================================================
// رسم اللوحة
// ==================================================

function createBoardImage(game) {
    const width = 900;
    const height = 900;

    const canvas = createCanvas(
        width,
        height
    );

    const ctx = canvas.getContext("2d");

    // الخلفية
    const background =
        ctx.createLinearGradient(
            0,
            0,
            width,
            height
        );

    background.addColorStop(
        0,
        "#10051f"
    );

    background.addColorStop(
        0.5,
        "#241044"
    );

    background.addColorStop(
        1,
        "#090512"
    );

    ctx.fillStyle = background;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    // العنوان
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px HINA";

    ctx.fillText(
        "HINA • XO",
        width / 2,
        55
    );

    // أسماء اللاعبين
    ctx.font = "bold 27px HINA";

    ctx.fillStyle =
        game.turn === "X"
            ? "#c084fc"
            : "#aaa0bb";

    ctx.fillText(
        `${game.player1.name}  [ X ]`,
        230,
        115
    );

    ctx.fillStyle =
        game.turn === "O"
            ? "#c084fc"
            : "#aaa0bb";

    ctx.fillText(
        `${game.player2.name}  [ O ]`,
        670,
        115
    );

    // اللوحة
    const boardX = 100;
    const boardY = 170;
    const boardSize = 700;
    const cellSize = boardSize / 3;

    ctx.fillStyle =
        "rgba(255,255,255,0.04)";

    ctx.roundRect(
        boardX,
        boardY,
        boardSize,
        boardSize,
        30
    );

    ctx.fill();

    // الخطوط
    ctx.strokeStyle =
        "rgba(192,132,252,0.65)";

    ctx.lineWidth = 8;

    ctx.lineCap = "round";

    for (let i = 1; i < 3; i++) {
        const position =
            boardX + cellSize * i;

        ctx.beginPath();
        ctx.moveTo(
            position,
            boardY + 25
        );
        ctx.lineTo(
            position,
            boardY + boardSize - 25
        );
        ctx.stroke();

        const horizontal =
            boardY + cellSize * i;

        ctx.beginPath();
        ctx.moveTo(
            boardX + 25,
            horizontal
        );
        ctx.lineTo(
            boardX + boardSize - 25,
            horizontal
        );
        ctx.stroke();
    }

    // الخانات
    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;

        const centerX =
            boardX +
            col * cellSize +
            cellSize / 2;

        const centerY =
            boardY +
            row * cellSize +
            cellSize / 2;

        const value =
            game.board[i];

        if (!value) {
            ctx.fillStyle =
                "rgba(255,255,255,0.30)";

            ctx.font =
                "bold 30px HINA";

            ctx.fillText(
                String(i + 1),
                centerX,
                centerY
            );

            continue;
        }

        if (value === "X") {
            ctx.strokeStyle =
                "#c084fc";

            ctx.lineWidth = 22;

            ctx.beginPath();

            ctx.moveTo(
                centerX - 55,
                centerY - 55
            );

            ctx.lineTo(
                centerX + 55,
                centerY + 55
            );

            ctx.moveTo(
                centerX + 55,
                centerY - 55
            );

            ctx.lineTo(
                centerX - 55,
                centerY + 55
            );

            ctx.stroke();

        } else {
            ctx.strokeStyle =
                "#e9d5ff";

            ctx.lineWidth = 20;

            ctx.beginPath();

            ctx.arc(
                centerX,
                centerY,
                62,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }

    // خط الفوز
    const result =
        checkWinner(game.board);

    if (
        result &&
        result.winner !== "draw" &&
        result.cells.length === 3
    ) {
        const first =
            result.cells[0];

        const last =
            result.cells[2];

        const firstRow =
            Math.floor(first / 3);

        const firstCol =
            first % 3;

        const lastRow =
            Math.floor(last / 3);

        const lastCol =
            last % 3;

        const x1 =
            boardX +
            firstCol * cellSize +
            cellSize / 2;

        const y1 =
            boardY +
            firstRow * cellSize +
            cellSize / 2;

        const x2 =
            boardX +
            lastCol * cellSize +
            cellSize / 2;

        const y2 =
            boardY +
            lastRow * cellSize +
            cellSize / 2;

        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth = 12;

        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();
    }

    // الحالة
    let status = "";

    if (game.status === "playing") {
        const current =
            game.turn === "X"
                ? game.player1.name
                : game.player2.name;

        status =
            `دور ${current} — أرسل رقم الخانة 1 إلى 9`;

    } else {
        const result =
            checkWinner(game.board);

        if (
            result &&
            result.winner === "draw"
        ) {
            status = "تعادل";
        } else if (
            result &&
            result.winner === "X"
        ) {
            status =
                `الفائز: ${game.player1.name}`;
        } else if (
            result &&
            result.winner === "O"
        ) {
            status =
                `الفائز: ${game.player2.name}`;
        }
    }

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 28px HINA";

    ctx.fillText(
        status,
        width / 2,
        850
    );

    return canvas.toBuffer("image/png");
}

// ==================================================
// إرسال اللوحة وتسجيل HandleReply
// ==================================================

function removeGameReplies(gameID) {
    if (
        !global.client ||
        !Array.isArray(
            global.client.handleReply
        )
    ) {
        return;
    }

    global.client.handleReply =
        global.client.handleReply.filter(
            item =>
                item.gameID !== gameID
        );
}

function saveImage(buffer) {
    const file = path.join(
        os.tmpdir(),
        `hina_xo_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.png`
    );

    fs.writeFileSync(
        file,
        buffer
    );

    return file;
}

function sendBoard({
    api,
    game,
    event
}) {
    return new Promise(resolve => {
        const buffer =
            createBoardImage(game);

        const imagePath =
            saveImage(buffer);

        let messageText =
            "لعبة XO\n\n";

        if (game.status === "playing") {
            messageText +=
                "قم بالرد على هذه الصورة برقم الخانة من 1 إلى 9";
        } else {
            const result =
                checkWinner(game.board);

            if (
                result &&
                result.winner === "draw"
            ) {
                messageText +=
                    "انتهت اللعبة بالتعادل";
            } else {
                const winner =
                    result.winner === "X"
                        ? game.player1.name
                        : game.player2.name;

                messageText +=
                    `انتهت اللعبة\nالفائز: ${winner}`;
            }
        }

        try {
            api.sendMessage(
                {
                    body: messageText,
                    attachment:
                        fs.createReadStream(
                            imagePath
                        )
                },
                game.threadID,
                (error, info) => {
                    try {
                        fs.unlinkSync(
                            imagePath
                        );
                    } catch {}

                    if (error || !info) {
                        return resolve(
                            null
                        );
                    }

                    game.boardMessageID =
                        info.messageID;

                    // تسجيل HandleReply
                    if (
                        !global.client
                            .handleReply
                    ) {
                        global.client
                            .handleReply = [];
                    }

                    if (
                        game.status ===
                        "playing"
                    ) {
                        global.client
                            .handleReply.push({
                                name: "اكسو",

                                messageID:
                                    info.messageID,

                                author:
                                    game.player1.id,

                                threadID:
                                    game.threadID,

                                gameID:
                                    game.id,

                                player1:
                                    game.player1.id,

                                player2:
                                    game.player2.id,

                                vsBot:
                                    game.vsBot
                            });
                    }

                    resolve(info);
                },
                event
                    ? event.messageID
                    : undefined
            );
        } catch (error) {
            try {
                fs.unlinkSync(
                    imagePath
                );
            } catch {}

            resolve(null);
        }
    });
}

// ==================================================
// إنهاء اللعبة
// ==================================================

function finishGame(game) {
    game.status = "finished";

    removeGameReplies(
        game.id
    );

    setTimeout(() => {
        games.delete(
            game.id
        );
    }, 60 * 1000);
}

// ==================================================
// تنفيذ حركة اللاعب
// ==================================================

async function makeMove({
    api,
    event,
    game,
    position
}) {
    if (
        game.status !== "playing"
    ) {
        return;
    }

    if (
        position < 0 ||
        position > 8
    ) {
        return;
    }

    if (
        game.board[position]
    ) {
        return api.sendMessage(
            "هذه الخانة مستخدمة بالفعل",
            event.threadID,
            event.messageID
        );
    }

    const senderID =
        String(event.senderID);

    // ==================================================
    // تحديد صاحب الدور
    // ==================================================

    if (game.turn === "X") {
        if (
            senderID !==
            game.player1.id
        ) {
            return;
        }
    } else {
        if (
            game.vsBot
        ) {
            return;
        }

        if (
            senderID !==
            game.player2.id
        ) {
            return;
        }
    }

    // الحركة
    game.board[position] =
        game.turn;

    const result =
        checkWinner(game.board);

    if (result) {
        finishGame(game);

        return sendBoard({
            api,
            game,
            event
        });
    }

    // تبديل الدور
    game.turn =
        game.turn === "X"
            ? "O"
            : "X";

    // ==================================================
    // حركة البوت
    // ==================================================

    if (
        game.vsBot &&
        game.turn === "O"
    ) {
        const move =
            botMove(game.board);

        if (
            move !== null
        ) {
            game.board[move] =
                "O";
        }

        const botResult =
            checkWinner(
                game.board
            );

        if (botResult) {
            finishGame(game);

            return sendBoard({
                api,
                game,
                event
            });
        }

        game.turn = "X";
    }

    return sendBoard({
        api,
        game,
        event
    });
}

// ==================================================
// بدء اللعبة
// ==================================================

module.exports.run = async function ({
    api,
    event
}) {
    const threadID =
        String(event.threadID);

    const player1ID =
        String(event.senderID);

    const player1Name =
        getName(event);

    // ==================================================
    // اللعب ضد شخص بالرد
    // ==================================================

    let player2ID = null;
    let player2Name = "HINA";
    let vsBot = true;

    if (
        event.messageReply &&
        event.messageReply.senderID
    ) {
        player2ID =
            String(
                event.messageReply.senderID
            );

        if (
            player2ID ===
            player1ID
        ) {
            return api.sendMessage(
                "لا يمكنك اللعب ضد نفسك",
                threadID,
                event.messageID
            );
        }

        player2Name =
            cleanName(
                event.messageReply.senderName,
                "الخصم"
            );

        vsBot = false;
    }

    // ==================================================
    // منع وجود أكثر من لعبة لنفس اللاعب
    // ==================================================

    for (const game of games.values()) {
        if (
            game.threadID !==
            threadID
        ) {
            continue;
        }

        if (
            game.status !==
            "playing"
        ) {
            continue;
        }

        if (
            game.player1.id ===
            player1ID ||
            game.player2.id ===
            player1ID
        ) {
            return api.sendMessage(
                "لديك لعبة XO قيد التشغيل بالفعل",
                threadID,
                event.messageID
            );
        }
    }

    // ==================================================
    // إنشاء اللعبة
    // ==================================================

    const game =
        createGame({
            threadID,
            player1ID,
            player1Name,
            player2ID,
            player2Name,
            vsBot
        });

    await sendBoard({
        api,
        game,
        event
    });
};

// ==================================================
// HandleReply
// ==================================================

module.exports.handleReply =
async function ({
    api,
    event,
    handleReply
}) {
    if (!event.body) {
        return;
    }

    const gameID =
        handleReply.gameID;

    if (!gameID) {
        return;
    }

    const game =
        games.get(gameID);

    if (!game) {
        return;
    }

    if (
        game.status !==
        "playing"
    ) {
        return;
    }

    const senderID =
        String(event.senderID);

    // ==================================================
    // التأكد أن اللاعب مشارك
    // ==================================================

    if (
        senderID !==
            game.player1.id &&
        senderID !==
            game.player2.id
    ) {
        return;
    }

    // ==================================================
    // التأكد من صاحب الدور
    // ==================================================

    if (
        game.turn === "X" &&
        senderID !==
            game.player1.id
    ) {
        return;
    }

    if (
        game.turn === "O" &&
        (
            game.vsBot ||
            senderID !==
                game.player2.id
        )
    ) {
        return;
    }

    // ==================================================
    // قراءة الحركة
    // ==================================================

    const body =
        String(event.body)
            .trim();

    if (
        !/^[1-9]$/.test(body)
    ) {
        return api.sendMessage(
            "أرسل رقم خانة واحد من 1 إلى 9",
            event.threadID,
            event.messageID
        );
    }

    const position =
        Number(body) - 1;

    await makeMove({
        api,
        event,
        game,
        position
    });
};