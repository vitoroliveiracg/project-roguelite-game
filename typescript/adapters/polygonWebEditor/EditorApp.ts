import type { HitboxModel } from "./Models/HitboxModel";
import type { ITool } from "./Tools/ITool";
import { PolygonTool } from "./Tools/PolygonTool";
import { SelectTool } from "./Tools/SelectTool";
import { CircleTool } from "./Tools/CircleTool";

class EditorApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    private spriteImage: HTMLImageElement | null = null;
    private hitboxes: HitboxModel[] = [];
    public currentTool: 'select' | 'polygon' | 'circle' = 'select';

    private panX: number = 0;
    private panY: number = 0;
    private zoom: number = 1;

    private history: HitboxModel[][] = [];
    private historyIndex: number = -1;

    private tools: Record<string, ITool> = {};
    
    constructor() {
        this.canvas = document.getElementById('editor-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.setupUI();
        this.setupTools();
        this.saveState(); // Salva o estado inicial (vazio) no histórico
        this.setupEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.render();
    }

    private saveState() {
        // Cria uma cópia profunda (Deep Copy) do array atual para desatrelar a referência da memória
        const state = JSON.parse(JSON.stringify(this.hitboxes));
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1); // Corta caminhos alternativos se você "desfez" e "desenhou algo novo"
        }
        this.history.push(state);
        this.historyIndex++;
    }

    private undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.hitboxes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.setupTools(); // Recria as ferramentas para elas usarem a nova referência de memória
            this.render();
        }
    }

    private redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.hitboxes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.setupTools();
            this.render();
        }
    }

    /** Inicializa os botões e os inputs de arquivo do navegador */
    private setupUI() {
        const btnLoad = document.getElementById('btn-load-image')!;
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        
        btnLoad.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleImageLoad(e));

        const btnExport = document.getElementById('btn-export')!;
        btnExport.addEventListener('click', () => this.exportJSON());

        const btnImport = document.getElementById('btn-import')!;
        const fileImportInput = document.getElementById('file-import-input') as HTMLInputElement;
        btnImport.addEventListener('click', () => fileImportInput.click());
        fileImportInput.addEventListener('change', (e) => this.importJSON(e));

        const btnClear = document.getElementById('btn-clear')!;
        btnClear.addEventListener('click', () => {
            this.hitboxes = [];
            this.setupTools();
            this.saveState();
            this.render();
        });

        // ============================================
        // DRAG AND DROP & UI
        // ============================================
        const container = document.getElementById('canvas-container')!;
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.boxShadow = 'inset 0 0 20px #55aaff';
        });
        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            container.style.boxShadow = 'none';
        });
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.boxShadow = 'none';
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) this.loadImageFile(files[0]!);
        });

        const helpHeader = document.getElementById('controls-help-header')!;
        const helpPanel = document.getElementById('controls-help')!;
        const btnToggleHelp = document.getElementById('btn-toggle-help')!;

        const toggleHelp = (e: Event) => {
            e.stopPropagation();
            helpPanel.classList.toggle('closed');
        };

        helpHeader.addEventListener('click', toggleHelp);
        btnToggleHelp.addEventListener('click', toggleHelp);

        // Gerenciamento de estado das ferramentas
        const tools = ['select', 'polygon', 'circle'] as const;
        tools.forEach(tool => {
            const btn = document.getElementById(`btn-tool-${tool}`)!;
            btn.addEventListener('click', () => {
                this.tools[this.currentTool]?.reset(); // Reseta a ferramenta anterior
                tools.forEach(t => document.getElementById(`btn-tool-${t}`)!.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = tool;
                this.render();
            });
        });
    }

    private setupTools() {
        this.tools['polygon'] = new PolygonTool((hitbox) => {
            this.hitboxes.push(hitbox);
            this.saveState();
            this.render();
        });
        this.tools['circle'] = new CircleTool((hitbox) => {
            this.hitboxes.push(hitbox);
            this.saveState();
            this.render();
        });
        this.tools['select'] = new SelectTool(this.hitboxes, () => {
            this.saveState();
            this.render();
        });
    }

    private setupEvents() {
        // Tradutor de posição da tela (Mouse) para o Universo do Canvas (Com Panning e Zoom)
        const getWorldPos = (e: MouseEvent) => {
            return {
                x: (e.offsetX - this.panX) / this.zoom,
                y: (e.offsetY - this.panY) / this.zoom
            };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.tools[this.currentTool]?.onMouseDown(e, getWorldPos(e), this.zoom);
            this.render();
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.tools[this.currentTool]?.onMouseMove(e, getWorldPos(e), this.zoom);
            this.render();
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.tools[this.currentTool]?.onMouseUp(e, getWorldPos(e), this.zoom);
            this.render();
        });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Evita menu do navegador no click direito
        
        window.addEventListener('keydown', (e) => {
            // Atalhos de Histórico (Ctrl+Z / Ctrl+Y)
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    const tool = this.tools[this.currentTool];
                    if (tool?.onUndo && tool.onUndo()) {
                        this.render();
                    } else {
                        this.undo();
                    }
                    return;
                }
                if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    const tool = this.tools[this.currentTool];
                    if (tool?.onRedo && tool.onRedo()) {
                        this.render();
                    } else {
                        this.redo();
                    }
                    return;
                }
            }
            
            // Atalho para Limpar Todas (Rápido, sem pop-up)
            if (e.shiftKey && e.key === 'Delete') {
                e.preventDefault();
                this.hitboxes = [];
                this.setupTools();
                this.saveState();
                this.render();
                return;
            }

            this.tools[this.currentTool]?.onKeyDown(e);
            this.render();
        });

        // ============================================
        // SISTEMA DE CÂMERA (ZOOM E PAN)
        // ============================================
        const container = document.getElementById('canvas-container')!;
        container.addEventListener('wheel', (e) => {
            e.preventDefault(); // Impede que o browser dê zoom na página toda ou role a página
            
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;

            if (e.ctrlKey || e.metaKey) {
                // Lógica de Zoom focado no ponteiro do mouse
                const zoomSensitivity = 0.002;
                const delta = -e.deltaY * zoomSensitivity;
                const prevZoom = this.zoom;
                this.zoom = Math.min(Math.max(0.1, this.zoom + delta), 50); // Ampliado para 50x de zoom!
                
                // Corrige o offset do Pan para manter o pixel sob o cursor inalterado
                const worldX = (mouseX - this.panX) / prevZoom;
                const worldY = (mouseY - this.panY) / prevZoom;
                this.panX = mouseX - worldX * this.zoom;
                this.panY = mouseY - worldY * this.zoom;
            } else if (e.shiftKey) {
                this.panX -= e.deltaY; // Mover Horizontalmente
            } else {
                this.panY -= e.deltaY; // Mover Verticalmente
            }
            
            this.updateCanvasTransform();
        }, { passive: false });
    }

    private updateCanvasTransform() {
        this.render(); // Não delegamos mais pro CSS, o Canvas resolve nativamente na renderização!
    }

    /** RF01: Carregar Sprite via File Reader API nativo do Browser */
    private handleImageLoad(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        this.loadImageFile(target.files[0]!);
    }

    private loadImageFile(file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.spriteImage = img;
                
                const container = document.getElementById('canvas-container')!;
                this.panX = (container.clientWidth - img.width) / 2;
                this.panY = (container.clientHeight - img.height) / 2;
                this.zoom = 1;
                this.updateCanvasTransform();

                this.render();
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    private resize() {
        const container = document.getElementById('canvas-container')!;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        if (!this.spriteImage) {
            // Centraliza o placeholder vazio
            this.panX = (container.clientWidth - 400) / 2;
            this.panY = (container.clientHeight - 400) / 2;
        }
        this.render();
    }

    private exportJSON() {
        const data = JSON.stringify({ hitboxes: this.hitboxes }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sprite_hitboxes.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    private importJSON(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        
        const file = target.files[0]!;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data && Array.isArray(data.hitboxes)) {
                    this.hitboxes = data.hitboxes;
                    this.setupTools();
                    this.saveState();
                    this.render();
                    alert('Hitboxes importadas com sucesso!');
                } else { alert('Formato de JSON inválido.'); }
            } catch (err) { alert('Erro ao ler o arquivo JSON.'); }
            target.value = ''; // Reseta para permitir re-importação do mesmo arquivo
        };
        reader.readAsText(file);
    }

    public render() {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aplica a câmera matemática diretamente no processador 2D do Canvas
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.imageSmoothingEnabled = false; // Mantém a pixel art pura

        if (this.spriteImage) {
            this.ctx.drawImage(this.spriteImage, 0, 0);
            
            // Borda guia substituindo o box-shadow perdido do CSS
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1 / this.zoom;
            this.ctx.strokeRect(0, 0, this.spriteImage.width, this.spriteImage.height);
        }

        // Volta para o espaço da Tela (Screen Space) para desenhar UI e Hitboxes com precisão
        this.ctx.resetTransform();

        const pX = (x: number) => x * this.zoom + this.panX;
        const pY = (y: number) => y * this.zoom + this.panY;

        // 1. Desenha as hitboxes já criadas (Projetadas na tela)
        this.ctx.lineWidth = 2;
        for (const hb of this.hitboxes) {
            if (hb.type === 'polygon' && hb.points) {
                this.ctx.strokeStyle = '#55aaff';
                this.ctx.beginPath();
                this.ctx.moveTo(pX(hb.points[0]!.x), pY(hb.points[0]!.y));
                for (let i = 1; i < hb.points.length; i++) this.ctx.lineTo(pX(hb.points[i]!.x), pY(hb.points[i]!.y));
                this.ctx.closePath();
                this.ctx.stroke();
                this.ctx.fillStyle = 'rgba(85, 170, 255, 0.3)'; this.ctx.fill();
            } else if (hb.type === 'circle' && hb.radius !== undefined) {
                this.ctx.strokeStyle = '#ffaa55';
                this.ctx.beginPath();
                this.ctx.arc(pX(hb.coordinates.x), pY(hb.coordinates.y), hb.radius * this.zoom, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.fillStyle = 'rgba(255, 170, 85, 0.3)'; this.ctx.fill();
                
                this.ctx.fillStyle = '#ff0000'; this.ctx.beginPath();
                this.ctx.arc(pX(hb.coordinates.x), pY(hb.coordinates.y), 4, 0, Math.PI * 2); this.ctx.fill();
            }
        }

        // 2. Deixa a Ferramenta atual desenhar seus overlays
        this.tools[this.currentTool]?.draw(this.ctx, this.panX, this.panY, this.zoom);
    }
}

window.onload = () => new EditorApp();