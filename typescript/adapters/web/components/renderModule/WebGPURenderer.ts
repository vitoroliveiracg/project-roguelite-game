import { logger } from "../../shared/Logger";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import type { objectTypeId } from "../../../../domain/ObjectModule/objectType.type";
import type Canvas from "../canvasModule/Canvas";
import type IRenderer from "./IRenderer";

/**
 * Configuração para um spritesheet.
 */
export interface SpriteConfig {
  // Coordenadas do sprite dentro do Texture Atlas (em pixels)
  atlasOffset: { x: number, y: number };
  spriteSize: { width: number, height: number };
  frameCount: number;
  animationSpeed: number; // frames do jogo a esperar antes de avançar a animação
}

/**
 * Orquestra o processo de desenho usando a API WebGPU.
 * Esta classe é responsável por inicializar o dispositivo WebGPU,
 * configurar o canvas e executar os comandos de renderização a cada frame.
 */
export default class WebGPURenderer implements IRenderer<EntityRenderableState & { currentFrame: number; }> {
  public canvas: Canvas;

  // Propriedades da WebGPU
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private presentationFormat!: GPUTextureFormat;
  private renderPipeline!: GPURenderPipeline;
  private vertexBuffer!: GPUBuffer;
  private cameraMatrix!: Float32Array;
  private cameraBuffer!: GPUBuffer;

  // Buffers e Bind Groups para instancing
  private instanceBuffer!: GPUBuffer;
  private instanceData!: Float32Array;
  private readonly MAX_INSTANCES = 1000; // Máximo de objetos que podemos desenhar de uma vez

  // Recursos para o Texture Atlas
  private atlasTexture!: GPUTexture;
  private atlasBindGroup!: GPUBindGroup;
  private sampler!: GPUSampler;
  private atlasSize = { width: 0, height: 0 };


  // Mapeia um tipo de entidade e estado para uma configuração de sprite
  private spriteConfigs: Map<string, SpriteConfig> = new Map();

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Inicializa o ambiente WebGPU de forma assíncrona.
   * @throws {Error} Se a WebGPU não for suportada pelo navegador.
   */
  public async initialize(): Promise<void> {
    logger.log('init', 'Initializing WebGPU Renderer...');

    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.element.getContext('webgpu') as GPUCanvasContext;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
    });

    this.loadSpriteConfigs();

    await this.setupRendering();

    logger.log('init', 'WebGPU Renderer initialized successfully.');
  }

  public clear(): void {
    // No-op: Clearing is handled by the render pass descriptor in drawFrame.
    // This method exists to satisfy the IRenderer interface.
  }

  /**
   * Desenha um único frame.
   * Por enquanto, apenas limpa a tela com uma cor sólida.
   */
  public async drawFrame(domainState: { world: any, renderables: readonly (EntityRenderableState & { currentFrame: number; })[] }, cameraTarget: EntityRenderableState | undefined): Promise<void> {
    const { renderables } = domainState;
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.2, b: 0.5, a: 1.0 }, // Cor de fundo azul
        loadOp: 'clear',
        storeOp: 'store',
      }],
    };

    // Atualiza a matriz da câmera uma vez por frame
    this.updateCamera(cameraTarget);

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setBindGroup(0, this.atlasBindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);

    if (renderables.length > 0) {
      this.updateInstanceBuffer(renderables);
      passEncoder.draw(6, renderables.length, 0, 0); // Desenha 6 vértices, N instâncias
    }


    this.device.queue.submit([commandEncoder.finish()]);
  }

  private updateCamera(target: EntityRenderableState | undefined): void {
    const { width, height } = this.canvas.element;
    const zoom = 3; // TODO: Mover para a classe Camera

    const viewWidth = width / zoom;
    const viewHeight = height / zoom;

    // Posição da câmera centralizada no alvo
    const camX = target ? (target.coordinates.x + target.size.width / 2) - viewWidth / 2 : 0;
    const camY = target ? (target.coordinates.y + target.size.height / 2) - viewHeight / 2 : 0;

    // Matriz de Projeção Ortográfica
    const left = camX;
    const right = camX + viewWidth;
    const top = camY;
    const bottom = camY + viewHeight;

    const sx = 2.0 / (right - left);
    const sy = 2.0 / (top - bottom); // Invertido para WebGPU
    const tx = -(right + left) / (right - left);
    const ty = -(top + bottom) / (top - bottom);

    this.cameraMatrix = new Float32Array([
      sx, 0,  0, 0,
      0,  sy, 0, 0,
      0,  0,  1, 0,
      tx, ty, 0, 1,
    ]);

    this.device.queue.writeBuffer(this.cameraBuffer, 0, this.cameraMatrix.buffer);
  }

    private loadSpriteConfigs(): void {
    // Posições e tamanhos dos sprites no atlas imaginário 'atlas.png'
    // As coordenadas (atlasOffset) são o canto superior esquerdo de cada spritesheet dentro do atlas.
    this.spriteConfigs.set('player-idle', { atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 32, height: 32 }, frameCount: 2, animationSpeed: 20 });
    this.spriteConfigs.set('player-walking', { atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 32, height: 32 }, frameCount: 2, animationSpeed: 10 });
    this.spriteConfigs.set('slime-walking', { atlasOffset: { x: 64, y: 0 }, spriteSize: { width: 32, height: 32 }, frameCount: 8, animationSpeed: 10 });
    this.spriteConfigs.set('simpleBullet-travelling', { atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 16, height: 16 }, frameCount: 1, animationSpeed: 10 });
  }

  public getSpriteConfig(type: objectTypeId, state?: string): SpriteConfig | undefined {
    return this.spriteConfigs.get(`${type}-${state}`);
  }

  private updateInstanceBuffer(renderables: readonly (EntityRenderableState & { currentFrame: number })[]): void {
    let offset = 0;
    for (const state of renderables) {
      // Dados da Instância (pos, scale, rot)
      this.instanceData[offset++] = state.coordinates.x;
      this.instanceData[offset++] = state.coordinates.y;
      this.instanceData[offset++] = state.size.width;
      this.instanceData[offset++] = state.size.height;
      this.instanceData[offset++] = state.rotation;
      
      // Dados de Animação
      const config = this.getSpriteConfig(state.entityTypeId, state.state);
      this.instanceData[offset++] = state.currentFrame;                               // frameIndex
      this.instanceData[offset++] = config?.frameCount ?? 1;                          // totalFrames
      this.instanceData[offset++] = config?.atlasOffset.x ?? 0;                       // atlasOffsetX
      this.instanceData[offset++] = config?.atlasOffset.y ?? 0;                       // atlasOffsetY
      this.instanceData[offset++] = config?.spriteSize.width ?? state.size.width;     // spriteWidth
      this.instanceData[offset++] = config?.spriteSize.height ?? state.size.height;   // spriteHeight

    }
    this.device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData.buffer, 0, offset * 4); // Usamos .buffer e o tamanho em bytes
  }

  private async setupRendering(): Promise<void> {
    const vertices = new Float32Array([ // Agora os vértices são relativos ao centro (0,0)
      // Triângulo 1 (Posição | UV)
      -0.5,  0.5, 0, 0, // Top-left (X, Y, U, V)
      -0.5, -0.5, 0, 1, // Bottom-left (X, Y, U, V)
       0.5, -0.5, 1, 1, // Bottom-right (X, Y, U, V)
      // Triângulo 2 (Posição | UV)
      -0.5,  0.5, 0, 0, // Top-left
       0.5, -0.5, 1, 1, // Bottom-right
       0.5,  0.5, 1, 0, // Top-right
    ]);

    this.vertexBuffer = this.device.createBuffer({
      label: 'Quad Vertex Buffer',
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    // Buffer para os dados de todas as instâncias
    // Inst(pos,scale,rot)(8) + Anim(idx,count,offset,size)(8) = 16 floats
    const INSTANCE_SIZE_IN_FLOATS = 8 + 8;
    this.instanceData = new Float32Array(this.MAX_INSTANCES * INSTANCE_SIZE_IN_FLOATS);
    this.instanceBuffer = this.device.createBuffer({
        label: "Instance Data Buffer",
        size: this.instanceData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Buffer para a matriz da câmera
    this.cameraBuffer = this.device.createBuffer({
      label: "Camera Uniform Buffer",
      size: 16 * 4, // mat4x4<f32>
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Shaders (WGSL) - Atualizados para instancing
    const shaderModule = this.device.createShaderModule({
      label: 'Simple Quad Shader',
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4<f32>,
          @location(0) tex_coords: vec2<f32>,
        }

        struct Instance {
          pos: vec2<f32>,
          scale: vec2<f32>,
          rot: f32, // e 3 de padding
          // Dados de animação
          anim_data: vec2<f32>, // frameIndex, totalFrames
          atlas_offset: vec2<f32>,
          sprite_size: vec2<f32>,
        };

        @group(0) @binding(0) var mySampler: sampler;
        @group(0) @binding(1) var myTexture: texture_2d<f32>;
        @group(0) @binding(2) var<storage, read> instances: array<Instance>;

        @group(0) @binding(3) var<uniform> camera: mat4x4<f32>;
        @group(0) @binding(4) var<uniform> atlas_size: vec2<f32>;

        @vertex
        fn vs_main(
          @builtin(instance_index) instance_idx: u32,
          @location(0) pos: vec2<f32>, 
          @location(1) uv: vec2<f32>
        ) -> VertexOutput {
          var output: VertexOutput;
          let instance = instances[instance_idx];

          // Matriz de Rotação
          let cos_rot = cos(instance.rot);
          let sin_rot = sin(instance.rot);
          let rot_matrix = mat2x2<f32>(cos_rot, -sin_rot, sin_rot, cos_rot);

          // Aplica escala, rotação e translação
          var transformed_pos = rot_matrix * (pos * instance.scale) + instance.pos + (instance.scale / 2.0);

          // Calcula UVs da animação a partir do Atlas
          let frame_index = floor(instance.anim_data.x);
          let total_frames = instance.anim_data.y;
          
          // Normaliza o tamanho do sprite em relação ao atlas
          let sprite_uv_size = instance.sprite_size / atlas_size;
          let frame_uv_size = vec2<f32>(sprite_uv_size.x / total_frames, sprite_uv_size.y);
          
          let uv_offset = vec2<f32>(instance.atlas_offset.x / atlas_size.x, instance.atlas_offset.y / atlas_size.y);
          output.tex_coords = (uv * frame_uv_size) + uv_offset + vec2<f32>(frame_index * frame_uv_size.x, 0.0);

          output.position = camera * vec4<f32>(transformed_pos, 0.0, 1.0);
          return output;
        }

        @fragment
        fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
          return textureSample(myTexture, mySampler, input.tex_coords);
        }
      `,
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: 'Simple Quad Pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 4 * 4, // 4 floats (X, Y, U, V), 4 bytes cada
            attributes: [{
              shaderLocation: 0, // Corresponde ao @location(0) no shader
              offset: 0,
              format: 'float32x2',
            }, {
              shaderLocation: 1, // Corresponde ao @location(1) no shader (uv)
              offset: 2 * 4, // Pula os 2 primeiros floats (X, Y)
              format: 'float32x2',
            }],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: this.presentationFormat }],
      },
    });

    // Sampler global
    this.sampler = this.device.createSampler({
      magFilter: 'nearest', // Mantém os pixels nítidos ao ampliar
      minFilter: 'nearest', // Mantém os pixels nítidos ao reduzir
    });

    // Carrega a textura do Atlas
    // TODO: Substituir por uma URL real de um atlas combinado
    const atlasUrl = new URL('../../assets/maps/map.jpeg', import.meta.url).href; // Usando o mapa como placeholder
    const response = await fetch(atlasUrl);
    const imageBitmap = await createImageBitmap(await response.blob());

    this.atlasSize = { width: imageBitmap.width, height: imageBitmap.height };

    this.atlasTexture = this.device.createTexture({
      size: [this.atlasSize.width, this.atlasSize.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture: this.atlasTexture }, [this.atlasSize.width, this.atlasSize.height]);

    // Buffer para o tamanho do atlas
    const atlasSizeBuffer = this.device.createBuffer({
      size: 2 * 4, // vec2<f32>
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(atlasSizeBuffer, 0, new Float32Array([this.atlasSize.width, this.atlasSize.height]));

    // Bind Group único para o Atlas
    this.atlasBindGroup = this.device.createBindGroup({
      label: `Atlas Bind Group`,
      layout: this.renderPipeline.getBindGroupLayout(0), // Pega o layout do grupo 0 do pipeline
      entries: [
        { binding: 0, resource: this.sampler },
        { binding: 1, resource: this.atlasTexture.createView() },
        { binding: 2, resource: { buffer: this.instanceBuffer } },
        { binding: 3, resource: { buffer: this.cameraBuffer } },
        { binding: 4, resource: { buffer: atlasSizeBuffer } },
      ],
    });
  }
}