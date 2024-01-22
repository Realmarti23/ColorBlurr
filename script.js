import FastNoiseLite from "./FastNoiseLite.js";

let noise = new FastNoiseLite();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const image = document.getElementById('displayedImage');
let imageData = ctx.createImageData(canvas.width, canvas.height);

noise.SetFrequency(0.040);
noise.SetNoiseType(FastNoiseLite.NoiseType.Cellular);

let zAxis = 0;
let averageColor = [255, 255, 255];
let averageSecondColor = [255, 255, 255];

function RegenerateNoise() {
    let noiseData = [];

    for (let x = 0; x < canvas.width; x++) {
        noiseData[x] = [];
        for (let y = 0; y < canvas.height; y++) {
            noiseData[x][y] = noise.GetNoise(x, y, zAxis);
        }
    }

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            var rRatio = lerp(averageColor[0], averageSecondColor[0], -noiseData[x][y]);
            var gRatio = lerp(averageColor[1], averageSecondColor[1], -noiseData[x][y]);
            var bRatio = lerp(averageColor[2], averageSecondColor[2], -noiseData[x][y]);

            const i = y * canvas.width + x;
            imageData.data[i * 4 + 0] = (rRatio); // R value
            imageData.data[i * 4 + 1] = (gRatio); // G value
            imageData.data[i * 4 + 2] = (bRatio); // B value
            imageData.data[i * 4 + 3] = 255; // A value

        }
    }


    ctx.putImageData(imageData, 0, 0);
    setTimeout(() => {
        zAxis += 0.1;
        RegenerateNoise();
    }, 16);
}

function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

function rescale() {
    const maxx = Math.max(window.innerWidth, window.innerHeight)
    canvas.style.width = maxx + "px";
    canvas.style.height = maxx + "px";
}
rescale();

function get_average_rgb() {
    const context = document.createElement('canvas').getContext('2d');
    context.width = context.canvas.width = image.width;
    context.height = context.canvas.height = image.height;
    context.imageSmoothingEnabled = true;
    context.drawImage(image, 0, 0, image.width, image.height);
    getColors(context);
}

function getColors(c) {
    var col, colors = {};
    var pixels, r, g, b, a;
    r = g = b = a = 0;
    pixels = c.getImageData(0, 0, c.width, c.height);
    for (var i = 0, data = pixels.data; i < data.length; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        a = data[i + 3]; // alpha

        // skip pixels transparent
        if (a < 10)
            continue;
        col = rgbToHex(r, g, b);
        if (!colors[col])
            colors[col] = 0;
        colors[col]++;
    }

    const sortedColors = Object.entries(colors).sort((one, two) => {
        return two[1] - one[1];
    });

    for (let i = 0; i < sortedColors.length; i++) {
        averageColor = hexToRgb("#" + sortedColors[i][0]);
        let score = (averageColor[2] + averageColor[1] + averageColor[0]);
        score -= (averageColor[2] + averageColor[1] + averageColor[0]) / 3
        if (score < 280)
            break;
    }

    for (let i = 0; i < sortedColors.length; i++) {
        averageSecondColor = hexToRgb("#" + sortedColors[i][0]);
        let score = Math.abs(averageColor[0] - averageSecondColor[0]);
        score += Math.abs(averageColor[1] - averageSecondColor[1]);
        score += Math.abs(averageColor[2] - averageSecondColor[2]);
        score -= (averageColor[2] + averageColor[1] + averageColor[0]) / 3
        if (score > 80 && score < 240)
            break;
    }

    let score = averageColor[0] + averageColor[1] + averageColor[2];
    let score2 = averageSecondColor[0] + averageSecondColor[1] + averageSecondColor[2];

    if (score > score2) {
        let backup = averageColor;
        averageColor = averageSecondColor;
        averageSecondColor = backup;

        backup = score;
        score = score2;
        score2 = backup;
    }
    document.getElementById("main-header").style.backgroundColor = "rgb(" + averageSecondColor[0] + ", " + averageSecondColor[1] + ", " + averageSecondColor[2] + ")";

    const elements = document.querySelectorAll('.logo-text');
    elements.forEach(element => {
        element.style.color = score > 256 ? 'black' : 'white';
    });

    const elements2 = document.querySelectorAll('.title');
    elements2.forEach(element => {
        element.style.color = score > 256 ? 'black' : 'white';
    });

}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
}

RegenerateNoise();
addEventListener("resize", rescale);


document.getElementById('displayedImage').addEventListener('click', function () {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function (event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function (e) {
            image.src = e.target.result;
            image.style.display = 'block';

        };

        reader.readAsDataURL(file);
    }
});

image.onload = function () {
    get_average_rgb();
}
get_average_rgb();


