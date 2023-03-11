import Head from 'next/head';
import p5Types from 'p5';
import dynamic from 'next/dynamic';
import cat from '../../public/cat.jpg';
const Sketch = dynamic(() => import('react-p5'), {
    ssr: false,
});
type P5 = p5Types;
export default function Home() {
    return (
        <div className="dark flex min-h-screen w-full items-center justify-center">
            <Head>
                <title>Hello World!</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <MySketch />
            </main>
        </div>
    );
}
let x = 50;
const y = 50;
const WIDTH = 2000;
const HEIGHT = 2000;

function MySketch() {
    let foregroundImg: p5Types.Element | p5Types.Image | null;
    let img: p5Types.Element | p5Types.Image | null;
    let noise: p5Types.Image;

    let createButton: p5Types.Element;
    let saveButton: p5Types.Element;
    let thresholdSlider: p5Types.Element;
    let foregroundInput: p5Types.Element;
    let backgroundInput: p5Types.Element;

    const preload = (p5: P5) => {
        noise = p5.loadImage('/noise.png');
        img = p5.loadImage('./cat.jpg');
        foregroundImg = p5.loadImage('/test.png');
    };

    const drawBackground = (p5: P5) => {
        if (!img) console.log('No background lol');
        p5.background('black');
        p5.tint(255, thresholdSlider.value() as number);
        if (img) p5.image(img, 0, 0, WIDTH, HEIGHT);
        p5.noTint();
        p5.filter(p5.GRAY);
        p5.blend(noise, 0, 0, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT, p5.MULTIPLY);
    };

    const drawForeground = (p5: P5) => {
        if (!foregroundImg) console.log('No foreground lol');
        console.log(foregroundImg);
        p5.fill('white');

        if (foregroundImg) {
            p5.image(foregroundImg, 0, 0, WIDTH, HEIGHT);
        }
    };

    const setup = (p5: p5Types, canvasParentRef: Element) => {
        createButton = p5.createButton('Create');
        createButton.mousePressed(() => {
            drawBackground(p5);
            drawForeground(p5);
            makeDithered(p5, 1);
        });
        saveButton = p5.createButton('Save');
        saveButton.mousePressed(() => p5.saveCanvas('thing.png'));
        thresholdSlider = p5.createSlider(0, 255, 100, 1);
        thresholdSlider.mouseReleased(() => {
            drawBackground(p5);
            drawForeground(p5);
            console.log('Slider released', thresholdSlider.value());
        });
        foregroundInput = p5.createFileInput((file) => {
            //if (foregroundImg) foregroundImg.remove();
            if (file.type === 'image') {
                foregroundImg = p5.createImg(file.data, '');
                foregroundImg.hide();
                drawForeground(p5);
            } else {
                img = null;
            }
        });
        backgroundInput = p5.createFileInput((file) => {
            //if (img) img.remove();
            if (file.type === 'image') {
                img = p5.createImg(file.data, '');
                img.hide();
                drawBackground(p5);
            } else {
                img = null;
            }
        });

        p5.pixelDensity(1);
        p5.createCanvas(WIDTH, HEIGHT).parent(canvasParentRef);
        drawBackground(p5);
        drawForeground(p5);
        console.log('Done!');
    };
    const draw = (p5: p5Types) => {};

    return (
        <div className="aspect-square h-screen w-[100vh]">
            <Sketch setup={setup} preload={preload} draw={draw} />
        </div>
    );
}

function imageIndex(p5: P5, x: number, y: number) {
    return 4 * (x + y * p5.width);
}

function getColorAtindex(p5: P5, x: number, y: number) {
    let idx = imageIndex(p5, x, y);
    let pix = p5.pixels;
    let red = pix[idx];
    let green = pix[idx + 1];
    let blue = pix[idx + 2];
    let alpha = pix[idx + 3];
    return p5.color(red, green, blue, alpha);
}

function setColorAtIndex(p5: P5, x: number, y: number, clr: p5Types.Color) {
    let idx = imageIndex(p5, x, y);

    let pix = p5.pixels;
    pix[idx] = p5.red(clr);
    pix[idx + 1] = p5.green(clr);
    pix[idx + 2] = p5.blue(clr);
    pix[idx + 3] = p5.alpha(clr);
}

// Finds the closest step for a given value
// The step 0 is always included, so the number of steps
// is actually steps + 1

function closestStep(p5: P5, max: number, steps: number, value: number) {
    return p5.round((steps * value) / 255) * p5.floor(255 / steps);
}

function makeDithered(p5: P5, steps: number) {
    p5.loadPixels();

    for (let y = 0; y < p5.height; y++) {
        for (let x = 0; x < p5.width; x++) {
            let clr = getColorAtindex(p5, x, y);
            let oldR = p5.red(clr);
            let oldG = p5.green(clr);
            let oldB = p5.blue(clr);
            let newR = closestStep(p5, 255, steps, oldR);
            let newG = closestStep(p5, 255, steps, oldG);
            let newB = closestStep(p5, 255, steps, oldB);

            let newClr = p5.color(newR, newG, newB);
            setColorAtIndex(p5, x, y, newClr);

            let errR = oldR - newR;
            let errG = oldG - newG;
            let errB = oldB - newB;

            distributeError(p5, x, y, errR, errG, errB);
        }
    }

    p5.updatePixels();
}

function distributeError(
    p5: P5,
    x: number,
    y: number,
    errR: number,
    errG: number,
    errB: number
) {
    addError(p5, 7 / 16.0, x + 1, y, errR, errG, errB);
    addError(p5, 3 / 16.0, x - 1, y + 1, errR, errG, errB);
    addError(p5, 5 / 16.0, x, y + 1, errR, errG, errB);
    addError(p5, 1 / 16.0, x + 1, y + 1, errR, errG, errB);
}

function addError(
    p5: P5,
    factor: number,
    x: number,
    y: number,
    errR: number,
    errG: number,
    errB: number
) {
    if (x < 0 || x >= p5.width || y < 0 || y >= p5.height) return;
    let clr = getColorAtindex(p5, x, y);
    let r = p5.red(clr);
    let g = p5.green(clr);
    let b = p5.blue(clr);
    clr.setRed(r + errR * factor);
    clr.setGreen(g + errG * factor);
    clr.setBlue(b + errB * factor);

    setColorAtIndex(p5, x, y, clr);
}
