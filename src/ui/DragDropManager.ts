namespace fgui {
    var _inst: DragDropManager;

    export class DragDropManager {

        private _agent: GLoader;
        private _sourceData: Object;

        public static get inst(): DragDropManager {
            if (!_inst)
                _inst = new DragDropManager();
            return _inst;
        }

        constructor() {
            let a = this._agent = new GLoader();
            a.draggable = true;
            a.touchable = false;////important
            a.setSize(100, 100);
            a.setPivot(0.5, 0.5, true);
            a.align = "center";
            a.verticalAlign = "middle";
            a.sortingOrder = 1000000;
            a.on(DragEvent.END, this.__dragEnd, this);
        }

        public get dragAgent(): GObject {
            return this._agent;
        }

        public get dragging(): boolean {
            return this._agent.parent != null;
        }

        public startDrag(icon: string, sourceData?: any, touchPointID?: number): void {
            if (this._agent.parent)
                return;

            this._sourceData = sourceData;
            this._agent.url = icon;
            GRoot.inst.addChild(this._agent);
            var pt: THREE.Vector2 = GRoot.inst.globalToLocal(Stage.touchPos.x, Stage.touchPos.y);
            this._agent.setPosition(pt.x, pt.y);
            this._agent.startDrag(touchPointID != null ? touchPointID : -1);
        }

        public cancel(): void {
            if (this._agent.parent) {
                this._agent.stopDrag();
                GRoot.inst.removeChild(this._agent);
                this._sourceData = null;
            }
        }

        private __dragEnd(evt: Event): void {
            if (this._agent.parent == null) //cancelled
                return;

            GRoot.inst.removeChild(this._agent);

            var sourceData: any = this._sourceData;
            this._sourceData = null;

            var obj: GObject = GObject.cast(Stage.touchTarget);
            while (obj) {
                if (obj.hasListener(DragEvent.DROP)) {
                    obj.dispatchEvent(DragEvent.DROP, sourceData);
                    return;
                }

                obj = obj.parent;
            }
        }
    }
}
