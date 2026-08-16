const input = document.getElementById('input');
const text = document.getElementById('text');

const speed = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');

const fontSize = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');

const dialogue = document.getElementById('dialogue');

const startButton = document.getElementById('start');
const finishButton = document.getElementById('finish');
const clearButton = document.getElementById('clear');
const spriteSheetButton = document.getElementById('spriteSheet');

const spriteExportMode = document.getElementById('spriteExportMode');
const frameSelectWrap = document.getElementById('frameSelectWrap');
const frameSelect = document.getElementById('frameSelect');

let timer = null;
let currentIndex = 0;


// ============================================================
// SPEED
// ============================================================

function updateSpeed() {
    if (speedValue && speed) {
        speedValue.textContent = `${speed.value} ms`;
    }
}


// ============================================================
// FONT SIZE
// ============================================================

function updateFontSize() {
    if (!fontSize || !dialogue || !fontSizeValue) return;

    const size = Number(fontSize.value) || 20;

    dialogue.style.fontSize = `${size}px`;
    fontSizeValue.textContent = `${size}px`;
}


if (speed) {
    speed.addEventListener('input', updateSpeed);
}

if (fontSize) {
    fontSize.addEventListener('input', updateFontSize);
}

updateSpeed();
updateFontSize();


// ============================================================
// TYPEWRITER
// ============================================================

function typeText() {

    clearTimeout(timer);

    const value = input ? input.value : '';

    if (!value) {
        if (text) text.textContent = '';
        currentIndex = 0;
        return;
    }

    if (currentIndex >= value.length) {
        return;
    }

    if (text) {
        text.textContent =
            value.substring(0, currentIndex + 1);
    }

    currentIndex++;

    timer = setTimeout(
        typeText,
        Number(speed?.value) || 50
    );
}


if (startButton) {

    startButton.addEventListener('click', () => {

        clearTimeout(timer);

        currentIndex = 0;

        if (text) {
            text.textContent = '';
        }

        typeText();
    });
}


if (finishButton) {

    finishButton.addEventListener('click', () => {

        clearTimeout(timer);

        if (text) {
            text.textContent = input.value;
        }

        currentIndex = input.value.length;
    });
}


if (clearButton) {

    clearButton.addEventListener('click', () => {

        clearTimeout(timer);

        if (input) {
            input.value = '';
        }

        if (text) {
            text.textContent = '';
        }

        currentIndex = 0;
    });
}


// ============================================================
// PRETENDARD
// ============================================================

async function waitForFont() {

    if (!document.fonts) return;

    try {

        const size =
            Number(fontSize?.value) || 20;

        await document.fonts.load(
            `400 ${size}px "Pretendard"`
        );

        await document.fonts.ready;

    } catch (error) {

        console.warn(
            'Pretendard could not be loaded:',
            error
        );
    }
}


// ============================================================
// FRAME SELECTOR
// ============================================================

if (frameSelect) {

    frameSelect.innerHTML = '';

    for (let i = 1; i <= 36; i++) {

        const option =
            document.createElement('option');

        option.value = String(i);
        option.textContent = `Frame ${i}`;

        frameSelect.appendChild(option);
    }
}


if (spriteExportMode && frameSelectWrap) {

    function updateExportMode() {

        frameSelectWrap.hidden =
            spriteExportMode.value !== 'frame';
    }

    spriteExportMode.addEventListener(
        'change',
        updateExportMode
    );

    updateExportMode();
}


// ============================================================
// BUILD SPRITE SHEET
// ============================================================

async function buildTypewriterFrames() {

    const value =
        input ? input.value : '';

    if (!value) {

        alert(
            'Enter some text first.'
        );

        return null;
    }


    // ========================================================
    // EXACT FORMAT
    // ========================================================

    const FRAME_WIDTH = 170;
    const FRAME_HEIGHT = 170;

    const COLUMNS = 6;
    const ROWS = 6;

    const TOTAL_SLOTS =
        COLUMNS * ROWS;


    // ========================================================
    // ONE CHARACTER PER FRAME
    // ========================================================

    if (value.length > TOTAL_SLOTS) {

        alert(
            'This 6×6 format has 36 frames. ' +
            'Because it reveals one character per frame, ' +
            'the maximum is 36 characters.'
        );

        return null;
    }


    await waitForFont();


    // ========================================================
    // CANVAS
    // ========================================================

    const canvas =
        document.createElement('canvas');

    canvas.width =
        FRAME_WIDTH * COLUMNS;

    canvas.height =
        FRAME_HEIGHT * ROWS;


    const ctx =
        canvas.getContext('2d');


    if (!ctx) {

        alert(
            'Your browser could not create the canvas.'
        );

        return null;
    }


    // Transparent background
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle =
        '#ffffff';

    ctx.textAlign =
        'left';

    ctx.textBaseline =
        'middle';


    // ========================================================
    // PADDING
    // ========================================================

    const PAD_X = 8;
    const PAD_Y = 8;


    // ========================================================
    // FIND FONT SIZE THAT FITS
    // ========================================================

    function fitFontSize(frameText) {

        let size =
            Number(fontSize?.value) || 20;


        const maxWidth =
            FRAME_WIDTH - PAD_X * 2;

        const maxHeight =
            FRAME_HEIGHT - PAD_Y * 2;


        while (size > 6) {

            ctx.font =
                `400 ${size}px "Pretendard", sans-serif`;


            const metrics =
                ctx.measureText(frameText);


            const width =
                metrics.width;


            const height =
                (metrics.actualBoundingBoxAscent || size * 0.8) +
                (metrics.actualBoundingBoxDescent || size * 0.2);


            if (
                width <= maxWidth &&
                height <= maxHeight
            ) {

                return size;
            }


            size--;
        }


        return 6;
    }


    // ========================================================
    // GENERATE 36 FRAMES
    // ========================================================

    for (
        let i = 0;
        i < TOTAL_SLOTS;
        i++
    ) {

        const shown =
            Math.min(
                i + 1,
                value.length
            );


        const frameText =
            value.substring(
                0,
                shown
            );


        const col =
            i % COLUMNS;


        const row =
            Math.floor(
                i / COLUMNS
            );


        const frameX =
            col * FRAME_WIDTH;


        const frameY =
            row * FRAME_HEIGHT;


        // ----------------------------------------------------
        // IMPORTANT:
        // Completely isolate this frame.
        // ----------------------------------------------------

        ctx.save();


        ctx.beginPath();

        ctx.rect(
            frameX,
            frameY,
            FRAME_WIDTH,
            FRAME_HEIGHT
        );

        ctx.clip();


        // Clear ONLY this frame.
        ctx.clearRect(
            frameX,
            frameY,
            FRAME_WIDTH,
            FRAME_HEIGHT
        );


        // ----------------------------------------------------
        // Fit text
        // ----------------------------------------------------

        const fittedSize =
            fitFontSize(frameText);


        ctx.font =
            `400 ${fittedSize}px "Pretendard", sans-serif`;


        // ----------------------------------------------------
        // Draw
        // ----------------------------------------------------

        ctx.fillText(
            frameText,
            frameX + PAD_X,
            frameY + FRAME_HEIGHT / 2
        );


        ctx.restore();
    }


    return {
        canvas,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        COLUMNS,
        ROWS,
        TOTAL_SLOTS
    };
}


// ============================================================
// DOWNLOAD CANVAS
// ============================================================

function downloadCanvas(
    canvas,
    filename
) {

    if (!canvas) {

        alert(
            'No image was generated.'
        );

        return;
    }


    canvas.toBlob(
        function(blob) {

            if (!blob) {

                alert(
                    'Could not create PNG.'
                );

                return;
            }


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement('a');


            link.href =
                url;

            link.download =
                filename;


            // Important for iOS/Safari/GitHub Pages
            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);


            setTimeout(
                () => {
                    URL.revokeObjectURL(url);
                },
                1500
            );
        },
        'image/png'
    );
}


// ============================================================
// SPRITE SHEET BUTTON
// ============================================================

if (spriteSheetButton) {

    spriteSheetButton.addEventListener(
        'click',
        async () => {

            try {

                const result =
                    await buildTypewriterFrames();


                if (!result) {
                    return;
                }


                // ==================================================
                // INDIVIDUAL FRAME
                // ==================================================

                if (
                    spriteExportMode &&
                    spriteExportMode.value === 'frame'
                ) {

                    const frameNumber =
                        Math.max(
                            0,
                            Math.min(
                                result.TOTAL_SLOTS - 1,
                                Number(
                                    frameSelect?.value || 1
                                ) - 1
                            )
                        );


                    const col =
                        frameNumber %
                        result.COLUMNS;


                    const row =
                        Math.floor(
                            frameNumber /
                            result.COLUMNS
                        );


                    const frame =
                        document.createElement(
                            'canvas'
                        );


                    frame.width =
                        result.FRAME_WIDTH;

                    frame.height =
                        result.FRAME_HEIGHT;


                    const frameCtx =
                        frame.getContext('2d');


                    frameCtx.clearRect(
                        0,
                        0,
                        result.FRAME_WIDTH,
                        result.FRAME_HEIGHT
                    );


                    frameCtx.drawImage(

                        result.canvas,

                        col *
                            result.FRAME_WIDTH,

                        row *
                            result.FRAME_HEIGHT,

                        result.FRAME_WIDTH,

                        result.FRAME_HEIGHT,

                        0,
                        0,

                        result.FRAME_WIDTH,

                        result.FRAME_HEIGHT
                    );


                    downloadCanvas(
                        frame,
                        `typewriter-frame-${frameNumber + 1}-170x170.png`
                    );


                    return;
                }


                // ==================================================
                // FULL SPRITE SHEET
                // ==================================================

                downloadCanvas(
                    result.canvas,
                    'typewriter-sprite-sheet-1020x1020.png'
                );

            } catch (error) {

                console.error(
                    'Sprite export error:',
                    error
                );

                alert(
                    'Sprite sheet export failed. ' +
                    'Open the browser console for details.'
                );
            }
        }
    );
}
