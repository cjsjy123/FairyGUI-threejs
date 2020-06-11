namespace fgui {

    export class TextFormat {
        public size: number = 0;
        public font: string;
        public color: number = 0;
        public lineSpacing: number = 0;
        public letterSpacing: number = 0;
        public bold: boolean;
        public underline: boolean;
        public italic: boolean;
        public strikethrough: boolean;

        public align: AlignType;
        public outline: number = 0;
        public outlineColor: number = 0;
        public shadowOffset: THREE.Vector2 = new THREE.Vector2();
        public shadowColor: number = 0;

        public copy(source: TextFormat): void {
            this.size = source.size;
            this.font = source.font;
            this.color = source.color;
            this.lineSpacing = source.lineSpacing;
            this.letterSpacing = source.letterSpacing;
            this.bold = source.bold;
            this.underline = source.underline;
            this.italic = source.italic;
            this.strikethrough = source.strikethrough;
            this.align = source.align;
        }

        public equalStyle(aFormat: TextFormat): boolean {
            return this.size == aFormat.size && this.color == aFormat.color
                && this.bold == aFormat.bold && this.underline == aFormat.underline
                && this.italic == aFormat.italic
                && this.strikethrough == aFormat.strikethrough
                && this.align == aFormat.align;
        }
    }
}