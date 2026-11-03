// Runs the Figma "Pattern refraction" effect on the film-texture overlay with WebGPU.
// Every overlay uses the same image, size and parameters, so the effect renders once into a
// texture that is then copied into each overlay's canvas. Without WebGPU (or when the page is
// opened from file://, which blocks reading the image into the GPU), the plain blurred texture stays.
(function () {
  var targets = document.querySelectorAll("[data-shader-effect]");
  var effect = window.FigmaShaders && window.FigmaShaders.patternRefraction;
  if (!targets.length || !effect || !navigator.gpu) return;

  // Layer size of "Film texture overlay holographic23" in Figma, and its effect parameters
  var WIDTH = 1920;
  var HEIGHT = 1923;
  var PARAMS = {
    iorDispersion: 0,
    frost: 0,
    centerHandle: { x: 50, y: 31.546520233154297, radius: 5.341624736785889, angle: 0 },
    amount: 21,
    patternType: 0,
    seamlessness: 100,
    pixelWrapMode: 0,
  };
  var FORMAT = "rgba8unorm";

  function drawCover(img) {
    var canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    var scale = Math.max(WIDTH / img.naturalWidth, HEIGHT / img.naturalHeight);
    var w = img.naturalWidth * scale;
    var h = img.naturalHeight * scale;
    canvas.getContext("2d").drawImage(img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
    return canvas;
  }

  async function run() {
    var adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return;
    var device = await adapter.requestDevice();

    var img = targets[0].querySelector("img");
    await img.decode();

    var input = device.createTexture({
      size: [WIDTH, HEIGHT],
      format: FORMAT,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: drawCover(img) }, { texture: input }, [WIDTH, HEIGHT]);

    var output = device.createTexture({
      size: [WIDTH, HEIGHT],
      format: FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    var frame = { input: input, output: output, params: PARAMS, state: {} };
    effect.setup(device, frame);
    effect.render(device, frame);

    targets.forEach(function (el) {
      var canvas = el.querySelector("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      var context = canvas.getContext("webgpu");
      context.configure({
        device: device,
        format: FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        alphaMode: "premultiplied",
      });
      var encoder = device.createCommandEncoder();
      encoder.copyTextureToTexture({ texture: output }, { texture: context.getCurrentTexture() }, [WIDTH, HEIGHT]);
      device.queue.submit([encoder.finish()]);
      el.classList.add("is-shaded");
    });
  }

  run().catch(function (err) {
    console.warn("Pattern refraction shader unavailable; showing the unshaded film texture.", err);
  });
})();
