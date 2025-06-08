// WebGL-based Matrix effect with proper multi-color support
export class WebGLMatrixEffect {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl as WebGLRenderingContext;
    this.program = this.createShaderProgram();
  }

  private vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  private fragmentShaderSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_image;
    uniform float u_colorShift;
    uniform float u_contrast;
    uniform float u_brightness;
    uniform float u_time;

    // --- HSV/RGB Conversion Functions ---
    vec3 rgb2hsv(vec3 c){
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      vec4 texColor = texture2D(u_image, v_texCoord);

      // --- Get Color Properties ---
      vec3 hsv = rgb2hsv(texColor.rgb);
      float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      
      // --- Aggressive Highlight Protection ---
      // This is the key to preventing blue dots. It creates a strong mask for any
      // bright, desaturated pixel (like teeth and shirt collars).
      float whiteMask = smoothstep(0.7, 0.9, lum) * (1.0 - smoothstep(0.0, 0.2, hsv.y));

      // --- Build Color from a Stable Green Base ---
      
      // 1. Create the base green by blending the original green channel with a target Matrix green.
      vec3 matrixGreen = vec3(0.1, 0.8, 0.2);
      vec3 baseColor = mix(vec3(lum), matrixGreen, lum); // Start with grayscale and blend to green
      baseColor.g = max(baseColor.g, texColor.g); // Ensure original green intensity is respected

      // 2. Additively blend back original red and blue, controlled by colorShift.
      // This provides color variation without corrupting the hue.
      baseColor.r += texColor.r * u_colorShift * 0.5;
      baseColor.b += texColor.b * u_colorShift * 0.7;

      // --- Blend back the original white areas ---
      // This uses the highlight mask to force bright areas back to their original color.
      vec3 finalColor = mix(baseColor, texColor.rgb, whiteMask);

      // --- Post-Processing ---
      finalColor = (finalColor - 0.5) * u_contrast + 0.5;
      finalColor *= u_brightness;
      
      // Subtle Scanlines
      finalColor *= 1.0 - abs(sin(v_texCoord.y * 400.0)) * 0.08;
      
      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), texColor.a);
    }
  `;

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error("Could not create shader");

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error("Shader compilation error: " + info);
    }

    return shader;
  }

  private createShaderProgram(): WebGLProgram {
    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      this.vertexShaderSource
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.fragmentShaderSource
    );

    const program = this.gl.createProgram();
    if (!program) throw new Error("Could not create program");

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error("Program link error: " + info);
    }

    return program;
  }

  public processImage(
    image: HTMLImageElement | HTMLCanvasElement,
    options: {
      colorShift: number;
      contrast: number;
      brightness: number;
    }
  ): void {
    const gl = this.gl;

    // Set canvas size
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    gl.viewport(0, 0, image.width, image.height);

    // Create texture from image
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Setup vertices
    const vertices = new Float32Array([
      -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Use shader program
    gl.useProgram(this.program);

    // Set attributes
    const positionLocation = gl.getAttribLocation(this.program, "a_position");
    const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

    // Set uniforms
    gl.uniform1i(gl.getUniformLocation(this.program, "u_image"), 0);
    gl.uniform1f(
      gl.getUniformLocation(this.program, "u_colorShift"),
      options.colorShift
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "u_contrast"),
      options.contrast
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "u_brightness"),
      options.brightness
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "u_time"),
      Date.now() * 0.001
    );

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
