import Phaser from 'phaser';

interface ElementImageFile {
  state: number;
  src: string;
  data: HTMLImageElement;
  crossOrigin?: string;
  loader: Phaser.Loader.LoaderPlugin;
}

/**
 * Makes the loader's image-element path (`loader.imageLoadType: 'HTMLImageElement'`) hand an
 * image over only once it is decoded. Browsers decode an `<img>` lazily: without this, the first
 * `texImage2D` of each page decodes the whole PNG synchronously on the main thread, which turned
 * the deferred art batches after boot into a string of 200–350 ms frames. `decode()` does that
 * work off the main thread, so the upload is only an upload.
 *
 * Call before the game boots; every ImageFile (and SpriteSheetFile) created afterwards uses it.
 */
export function decodeLoadedImages() {
  const proto = Phaser.Loader.FileTypes.ImageFile.prototype as unknown as {
    loadImage(this: ElementImageFile): void;
  };
  proto.loadImage = function (this: ElementImageFile) {
    this.state = Phaser.Loader.FILE_LOADING;
    this.src = Phaser.Loader.GetURL(
      this as unknown as Phaser.Loader.File,
      this.loader.baseURL,
    ) as string;
    const image = new Image();
    this.data = image;
    if (this.crossOrigin !== undefined) image.crossOrigin = this.crossOrigin;
    image.decoding = 'async';
    image.src = this.src;
    image.decode().then(
      () => {
        this.state = Phaser.Loader.FILE_LOADED;
        this.loader.nextFile(this as unknown as Phaser.Loader.File, true);
      },
      // decode() rejects for a failed request and for an undecodable file alike.
      () => this.loader.nextFile(this as unknown as Phaser.Loader.File, false),
    );
  };
}
