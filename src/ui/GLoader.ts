import { DisplayObject } from "../core/DisplayObject";
import { MovieClip } from "../core/MovieClip";
import { NTexture } from "../core/NTexture";
import { ByteBuffer } from "../utils/ByteBuffer";
import { LoaderFillType, ObjectPropID, PackageItemType, AlignType, VertAlignType } from "./FieldTypes";
import { GComponent } from "./GComponent";
import { GObject } from "./GObject";
import { PackageItem } from "./PackageItem";
import { UIPackage } from "./UIPackage";
import { TextureLoader } from "three";

export class GLoader extends GObject {
    private _url: string;
    private _align: AlignType;
    private _valign: VertAlignType;
    private _autoSize: boolean;
    private _fill: number;
    private _shrinkOnly: boolean;

    private _contentItem: PackageItem;
    private _contentSourceWidth: number = 0;
    private _contentSourceHeight: number = 0;
    private _contentWidth: number = 0;
    private _contentHeight: number = 0;

    private _content: MovieClip;
    private _content2?: GComponent;

    private _updatingLayout: boolean;

    constructor() {
        super();
        this._url = "";
        this._fill = LoaderFillType.None;
        this._align = "left";
        this._valign = "top";
    }

    protected createDisplayObject(): void {
        this._displayObject = new DisplayObject();
        this._content = new MovieClip();
        this._displayObject.addChild(this._content);
    }

    public dispose(): void {
        if (this._contentItem && this._content.texture) {
            this.freeExternal(this._content.texture);
        }

        if (this._content2)
            this._content2.dispose();

        super.dispose();
    }

    public get url(): string {
        return this._url;
    }

    public set url(value: string) {
        if (this._url == value)
            return;

        this._url = value;
        this.loadContent();
        this.updateGear(7);
    }

    public get icon(): string {
        return this._url;
    }

    public set icon(value: string) {
        this.url = value;
    }

    public get align(): AlignType {
        return this._align;
    }

    public set align(value: AlignType) {
        if (this._align != value) {
            this._align = value;
            this.updateLayout();
        }
    }

    public get verticalAlign(): VertAlignType {
        return this._valign;
    }

    public set verticalAlign(value: VertAlignType) {
        if (this._valign != value) {
            this._valign = value;
            this.updateLayout();
        }
    }

    public get fill(): number {
        return this._fill;
    }

    public set fill(value: number) {
        if (this._fill != value) {
            this._fill = value;
            this.updateLayout();
        }
    }

    public get shrinkOnly(): boolean {
        return this._shrinkOnly;
    }

    public set shrinkOnly(value: boolean) {
        if (this._shrinkOnly != value) {
            this._shrinkOnly = value;
            this.updateLayout();
        }
    }

    public get autoSize(): boolean {
        return this._autoSize;
    }

    public set autoSize(value: boolean) {
        if (this._autoSize != value) {
            this._autoSize = value;
            this.updateLayout();
        }
    }

    public get playing(): boolean {
        return this._content.playing;
    }

    public set playing(value: boolean) {
        if (this._content.playing != value) {
            this._content.playing = value;
            this.updateGear(5);
        }
    }

    public get frame(): number {
        return this._content.frame;
    }

    public set frame(value: number) {
        if (this._content.frame != value) {
            this._content.frame = value;
            this.updateGear(5);
        }
    }

    public get color(): number {
        return this._content.graphics.color;
    }

    public set color(value: number) {
        if (this._content.graphics.color != value) {
            this._content.graphics.color = value;
            this.updateGear(4);
        }
    }

    public get content(): MovieClip {
        return this._content;
    }

    public get component(): GComponent {
        return this._content2;
    }

    protected loadContent(): void {
        this.clearContent();

        if (!this._url)
            return;

        if (this._url.startsWith("ui://"))
            this.loadFromPackage(this._url);
        else
            this.loadExternal();
    }

    protected loadFromPackage(itemURL: string): void {
        this._contentItem = UIPackage.getItemByURL(itemURL);
        if (this._contentItem) {
            this._contentItem = this._contentItem.getBranch();
            this._contentSourceWidth = this._contentItem.width;
            this._contentSourceHeight = this._contentItem.height;
            this._contentItem = this._contentItem.getHighResolution();
            this._contentItem.load();

            if (this._autoSize)
                this.setSize(this._contentSourceWidth, this._contentSourceHeight);

            if (this._contentItem.type == PackageItemType.Image) {
                if (this._contentItem.texture == null) {
                    this.setErrorState();
                }
                else {
                    this._content.texture = this._contentItem.texture;
                    this._content.scale9Grid = this._contentItem.scale9Grid;
                    this._content.scaleByTile = this._contentItem.scaleByTile;
                    this._content.tileGridIndice = this._contentItem.tileGridIndice;
                    this._contentSourceWidth = this._contentItem.width;
                    this._contentSourceHeight = this._contentItem.height;
                    this.updateLayout();
                }
            }
            else if (this._contentItem.type == PackageItemType.MovieClip) {
                this._contentSourceWidth = this._contentItem.width;
                this._contentSourceHeight = this._contentItem.height;
                this._content.interval = this._contentItem.interval;
                this._content.swing = this._contentItem.swing;
                this._content.repeatDelay = this._contentItem.repeatDelay;
                this._content.frames = this._contentItem.frames;
                this.updateLayout();
            }
            else if (this._contentItem.type == PackageItemType.Component) {
                var obj: GObject = UIPackage.createObjectFromURL(itemURL);
                if (!obj)
                    this.setErrorState();
                else if (!(obj instanceof GComponent)) {
                    obj.dispose();
                    this.setErrorState();
                }
                else {
                    this._content2 = obj;
                    this._displayObject.addChild(this._content2.displayObject);
                    this.updateLayout();
                }
            }
            else
                this.setErrorState();
        }
        else
            this.setErrorState();
    }

    protected loadExternal(): void {
        let url = this._url;
        new TextureLoader().load(this._url, tex => {
            if (url == this._url)
                this.onExternalLoadSuccess(new NTexture(tex));
        });
    }

    protected freeExternal(texture: NTexture): void {
    }

    protected onExternalLoadSuccess(texture: NTexture): void {
        this._content.texture = texture;
        this._content.scale9Grid = null;
        this._content.scaleByTile = false;
        this._contentSourceWidth = texture.width;
        this._contentSourceHeight = texture.height;
        this.updateLayout();
    }

    protected onExternalLoadFailed(): void {
        this.setErrorState();
    }

    private setErrorState(): void {
    }

    private clearErrorState(): void {
    }

    private updateLayout(): void {
        if (!this._content2 && !this._content.texture && !this._content.frames) {
            if (this._autoSize) {
                this._updatingLayout = true;
                this.setSize(50, 30);
                this._updatingLayout = false;
            }
            return;
        }

        this._contentWidth = this._contentSourceWidth;
        this._contentHeight = this._contentSourceHeight;

        if (this._autoSize) {
            this._updatingLayout = true;
            if (this._contentWidth == 0)
                this._contentWidth = 50;
            if (this._contentHeight == 0)
                this._contentHeight = 30;
            this.setSize(this._contentWidth, this._contentHeight);
            this._updatingLayout = false;

            if (this._contentWidth == this._width && this._contentHeight == this._height) {
                if (this._content2) {
                    this._content2.setPosition(0, 0);
                    this._content2.setScale(1, 1);
                }
                else {
                    this._content.setSize(this._contentWidth, this._contentHeight);
                    this._content.setPosition(0, 0);
                }
                return;
            }
        }

        var sx: number = 1, sy: number = 1;
        if (this._fill != LoaderFillType.None) {
            sx = this.width / this._contentSourceWidth;
            sy = this.height / this._contentSourceHeight;

            if (sx != 1 || sy != 1) {
                if (this._fill == LoaderFillType.ScaleMatchHeight)
                    sx = sy;
                else if (this._fill == LoaderFillType.ScaleMatchWidth)
                    sy = sx;
                else if (this._fill == LoaderFillType.Scale) {
                    if (sx > sy)
                        sx = sy;
                    else
                        sy = sx;
                }
                else if (this._fill == LoaderFillType.ScaleNoBorder) {
                    if (sx > sy)
                        sy = sx;
                    else
                        sx = sy;
                }

                if (this._shrinkOnly) {
                    if (sx > 1)
                        sx = 1;
                    if (sy > 1)
                        sy = 1;
                }

                this._contentWidth = this._contentSourceWidth * sx;
                this._contentHeight = this._contentSourceHeight * sy;
            }
        }

        if (this._content2)
            this._content2.setScale(sx, sy);
        else
            this._content.setSize(this._contentWidth, this._contentHeight);

        var nx: number, ny: number;
        if (this._align == "center")
            nx = Math.floor((this.width - this._contentWidth) / 2);
        else if (this._align == "right")
            nx = this.width - this._contentWidth;
        else
            nx = 0;
        if (this._valign == "middle")
            ny = Math.floor((this.height - this._contentHeight) / 2);
        else if (this._valign == "bottom")
            ny = this.height - this._contentHeight;
        else
            ny = 0;

        if (this._content2)
            this._content2.setPosition(nx, ny);
        else
            this._content.setPosition(nx, ny);
    }

    private clearContent(): void {
        this.clearErrorState();

        if (this._contentItem == null && this._content.texture) {
            this.freeExternal(this._content.texture);
        }
        this._content.texture = null;
        this._content.frames = null;

        if (this._content2) {
            this._content2.dispose();
            this._content2 = null;
        }

        this._contentItem = null;
    }

    protected handleSizeChanged(): void {
        super.handleSizeChanged();

        if (!this._updatingLayout)
            this.updateLayout();
    }

    public getProp(index: number): any {
        switch (index) {
            case ObjectPropID.Color:
                return this.color;
            case ObjectPropID.Playing:
                return this.playing;
            case ObjectPropID.Frame:
                return this.frame;
            case ObjectPropID.TimeScale:
                return this._content.timeScale;
            default:
                return super.getProp(index);
        }
    }

    public setProp(index: number, value: any): void {
        switch (index) {
            case ObjectPropID.Color:
                this.color = value;
                break;
            case ObjectPropID.Playing:
                this.playing = value;
                break;
            case ObjectPropID.Frame:
                this.frame = value;
                break;
            case ObjectPropID.TimeScale:
                this._content.timeScale = value;
                break;
            case ObjectPropID.DeltaTime:
                this._content.advance(value);
                break;
            default:
                super.setProp(index, value);
                break;
        }
    }

    public setup_beforeAdd(buffer: ByteBuffer, beginPos: number): void {
        super.setup_beforeAdd(buffer, beginPos);

        buffer.seek(beginPos, 5);

        var iv: number;

        this._url = buffer.readS();
        iv = buffer.readByte();
        this._align = iv == 0 ? "left" : (iv == 1 ? "center" : "right");
        iv = buffer.readByte();
        this._valign = iv == 0 ? "top" : (iv == 1 ? "middle" : "bottom");
        this._fill = buffer.readByte();
        this._shrinkOnly = buffer.readBool();
        this._autoSize = buffer.readBool();
        buffer.readBool(); //_showErrorSign
        this._content.playing = buffer.readBool();
        this._content.frame = buffer.readInt();

        if (buffer.readBool())
            this.color = buffer.readColor();

        this._content.fillMethod = buffer.readByte();
        if (this._content.fillMethod != 0) {
            this._content.fillOrigin = buffer.readByte();
            this._content.fillClockwise = buffer.readBool();
            this._content.fillAmount = buffer.readFloat();
        }

        if (this._url)
            this.loadContent();
    }
}
