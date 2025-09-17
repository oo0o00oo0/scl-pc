import * as pc from "playcanvas";

interface SplatRange {
  startIndex: number;
  count: number;
  sourceId: number;
}

export class GSplatSkinned {
  private app: pc.Application;
  private entity: pc.Entity | null = null;
  private numSplats: number = 0;
  private dataTexture: pc.Texture | null = null;
  private splatRanges: SplatRange[] = [];

  constructor(app: pc.Application) {
    this.app = app;
    this.entity = null;
  }

  loadWeightTexture(url: string) {
    const asset = new pc.Asset("weights", "texture", { url });
    this.app.assets.add(asset);

    asset.ready(() => {
      const texture = asset.resource as pc.Texture;
      texture.name = "vertex_weights_texture";

      this.dataTexture = texture;

      const material = this.entity?.gsplat?.material;
      if (material) {
        material.setParameter("vertex_weights_texture", this.dataTexture);
        material.update();
        this.app.renderNextFrame = true;
      } else {
        throw new Error("Material not found on entity");
      }
    });

    this.app.assets.load(asset);
  }

  async loadGsplat(url: string) {
    let ranges: SplatRange[] = [];
    const response = await fetch(url.replace(".ply", "_ranges.json"));
    ranges = await response.json();

    this.splatRanges = ranges;

    const asset = new pc.Asset("gsplat", "gsplat", { url });
    this.app.assets.add(asset);

    return new Promise((resolve) => {
      asset.ready((asset) => {
        const entity = new pc.Entity();
        this.entity = entity;

        // const rotationParent = new pc.Entity();
        // this.app.root.addChild(rotationParent);
        // rotationParent.addChild(entity);

        entity.setLocalEulerAngles(180, 0, 0);

        entity.addComponent("gsplat", { asset: asset });

        this.numSplats = (asset.resource as any).gsplatData.numSplats;

        if (this.splatRanges.length === 1) {
          this.splatRanges[0].count = this.numSplats;
        }

        this.app.root.addChild(entity);
        this.app.renderNextFrame = true;
        resolve(entity);
      });

      this.app.assets.load(asset);
    });
  }

  updateShader(vertexShader: string) {
    const material = this.entity?.gsplat?.material;
    if (!material) {
      console.error("No material found");
      return;
    }

    const textureSize = this.evalTextureSize(this.numSplats);

    this.dataTexture = this.createTexture(
      "chunks_data_texture",
      pc.PIXELFORMAT_RGBA16F,
      textureSize,
      null,
    );

    material.setParameter("chunks_data_texture", this.dataTexture);

    material.getShaderChunks("glsl").set(
      "gsplatVS",
      vertexShader,
    );

    material.update();
  }

  createTexture(
    name: string,
    format: number,
    size: pc.Vec2,
    data: any,
  ): pc.Texture {
    const texture = new pc.Texture(this.app.graphicsDevice, {
      name: name,
      width: size.x,
      height: size.y,
      format: format,
      cubemap: false,
      mipmaps: false,
      minFilter: pc.FILTER_NEAREST,
      magFilter: pc.FILTER_NEAREST,
      addressU: pc.ADDRESS_CLAMP_TO_EDGE,
      addressV: pc.ADDRESS_CLAMP_TO_EDGE,
      ...(data ? { levels: [data] } : {}),
    });

    this.updateDataTexture(texture);
    return texture;
  }

  updateDataTexture(texture: pc.Texture) {
    const float2Half = pc.FloatPacking.float2Half;
    const data = texture.lock();

    const pixelCount = Math.min(this.numSplats, texture.width * texture.height);

    for (const range of this.splatRanges) {
      const endIndex = Math.min(range.startIndex + range.count, pixelCount);
      for (let i = range.startIndex; i < endIndex; i++) {
        const r = 0;
        const g = 0;
        const b = 0;
        const a = range.sourceId;
        data[i * 4 + 0] = float2Half(r);
        data[i * 4 + 1] = float2Half(g);
        data[i * 4 + 2] = float2Half(b);
        data[i * 4 + 3] = float2Half(a);
      }
    }

    texture.unlock();
    texture.upload();
  }

  evalTextureSize(count: number): pc.Vec2 {
    const width = Math.ceil(Math.sqrt(count));
    const height = Math.ceil(count / width);
    return new pc.Vec2(width, height);
  }
}
