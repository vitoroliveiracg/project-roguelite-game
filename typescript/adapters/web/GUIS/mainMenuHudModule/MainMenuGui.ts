import { logger } from "../../shared/Logger";
import html from './mainMenu.html?raw';
import css from './mainMenu.css?raw';
import { LocalStorageAdapter } from "../../../../domain/ports/LocalStorageAdapter";
import { listen } from '@tauri-apps/api/event';

export default class MainMenuGui {
    private container!: HTMLElement;
    private animationFrameId: number | null = null;

    constructor(private onStartGameCallback: (mapId: string) => void) {
        this.injectUI();
        this.setupTabs();
        this.setupMapSelection();
        this.setupSaveSystem();
        logger.log('init', 'MainMenuGui instantiated and UI injected.');
    }

    private injectUI(): void {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.innerHTML = html;
        this.container = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.container);
    }

    private setupTabs(): void {
        const navBtns = this.container.querySelectorAll('.mm-nav-btn');
        const tabContents = this.container.querySelectorAll('.mm-tab-content');

        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                navBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                const targetId = (e.currentTarget as HTMLElement).getAttribute('data-target')!;
                (e.currentTarget as HTMLElement).classList.add('active');
                this.container.querySelector(`#${targetId}`)!.classList.add('active');
            });
        });
    }

    private setupMapSelection(): void {
        const mapContainer = this.container.querySelector('#map-layer') as HTMLElement;
        const fogBase = this.container.querySelector('#fog-base') as HTMLElement;
        const fogWisps = this.container.querySelector('#fog-wisps') as HTMLElement;
        const fogOverlay = this.container.querySelector('#fog-overlay') as HTMLElement;
        const viewport = this.container.querySelector('#map-viewport') as HTMLElement;
        const sonharBtn = this.container.querySelector('#btn-sonhar') as HTMLButtonElement;
        const cloudTransition = this.container.querySelector('#cloud-transition') as HTMLElement;
        
        // =========================================================================
        // DADOS MOCKADOS DAS ILHAS (Pode alterar a 'image' para texturas reais)
        // O 'scale' permite editar o tamanho, mas como as fronteiras se encaixam como países, 
        // escalar apenas um criará falhas geológicas (espaços vazios) entre eles!
        // =========================================================================
        const worlds = [
            { 
                id: 'vilgem', name: 'Vilgem', 
                path: 'M 250 150 Q 210 210 220 270 Q 290 330 380 280 Q 390 220 350 160 Q 300 170 250 150 Z', 
                cx: 300, cy: 260, scale: 1.0, image: 'https://picsum.photos/seed/vilgem/400/400' 
            }
        ];

        let selectedWorldId = 'vilgem';

        // Gera o SVG Dinamicamente para embutir as imagens usando clip-path na forma da ilha
        let svgContent = `<svg class="island-group" viewBox="0 0 600 400"><defs>`;
        // Pincéis de Cartografia Clássica (Hachuras, Montanhas, Árvores e Castelos)
        svgContent += `<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#2b1d14"/></marker>`;
        svgContent += `<pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M-2,2 l4,-4 M0,12 l12,-12 M10,14 l4,-4" stroke="#2b1d14" stroke-width="0.6" opacity="0.3"/></pattern>`;
        svgContent += `<g id="mountain"><path class="doodle-ink" d="M0,10 L6,0 L12,10 M6,0 L8,4" /></g>`;
        svgContent += `<g id="tree"><path class="doodle-ink" d="M5,0 L1,7 L4,7 L0,14 L10,14 L6,7 L9,7 Z M5,14 L5,18" /></g>`;
        svgContent += `<g id="castle"><path class="doodle-ink" d="M0,12 L0,0 L3,0 L3,3 L6,3 L6,0 L9,0 L9,12 M3,6 A1.5,1.5 0 0,0 6,6 M1,12 L8,12" /></g>`;
        worlds.forEach(w => { svgContent += `<clipPath id="clip-${w.id}"><path d="${w.path}"/></clipPath>`; });
        svgContent += `</defs>`;

        // Marcações Cartográficas de Fundo (Monstro Marinho e Coordenadas)
        svgContent += `<g transform="translate(40, 320)"><path class="doodle-ink" stroke-width="2" opacity="0.4" d="M 0 20 Q 20 -10 40 20 T 80 20 T 120 20 M 20 10 L 25 -5 L 30 10 M 60 10 L 65 -5 L 70 10" /><text x="0" y="45" class="doodle-text">Hic Sunt Dracones</text></g>`;
        svgContent += `<text x="20" y="30" class="doodle-text">Lat: 42° 15' N   Lon: 71° 8' W</text>`;

        // Conexões de Rios/Estradas
        svgContent += `<path d="M 160 220 Q 230 200 280 250" fill="none" stroke="#2b1d14" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrowhead)"/><text x="210" y="210" fill="#2b1d14" font-style="italic" font-family="Georgia" font-size="16">tp</text>`;
        svgContent += `<path d="M 320 250 Q 380 240 440 220" fill="none" stroke="#2b1d14" stroke-width="1.5" stroke-dasharray="6,4"/>`;

        worlds.forEach(w => {
            let interiorDoodles = '';
            if (w.id === 'vilgem') {
                interiorDoodles = `<use href="#mountain" x="250" y="200"/><use href="#mountain" x="270" y="190"/><use href="#mountain" x="290" y="205"/><use href="#castle" x="310" y="230"/>`;
            }

            svgContent += `
                <g class="world-node" data-id="${w.id}" style="transform: scale(${w.scale}); transform-origin: ${w.cx}px ${w.cy}px; transition: transform 0.3s;">
                    <!-- O Fundo do Papel da Ilha -->
                    <path class="island-border" d="${w.path}" />
                    <!-- As Hachuras de Nanquim cruzando a ilha -->
                    <path d="${w.path}" fill="url(#hatch)" pointer-events="none" />
                    <!-- Um contorno duplicado levemente deslocado para dar efeito de rascunho rápido à mão -->
                    <path d="${w.path}" fill="none" stroke="#2b1d14" stroke-width="1" stroke-dasharray="8,4,2,4" transform="translate(2, -1)" opacity="0.6" pointer-events="none" />
                    
                    <!-- Doodles (Montanhas/Árvores) Injetados -->
                    ${interiorDoodles}
                    
                    <text x="${w.cx}" y="${w.cy + 35}" class="island-text">${w.name}</text>
                </g>
            `;
        });
        
        // =========================================================================
        // PONTOS DE INTERESSE (POIs) MOCKADOS (Dungeons e Cidades como marcações de tinta)
        // =========================================================================
        svgContent += `
            <g class="map-poi-group">
                <circle cx="300" cy="260" r="10" class="map-poi" data-poi="vilgem_tower">
                    <title>Torre de Vilgem</title>
                </circle>
            </g>
        `;
        
        svgContent += `</svg>`;
        
        if (mapContainer) mapContainer.innerHTML = svgContent;

        // =========================================================================
        // LÓGICA DA CÂMERA INTERATIVA (PANNING, ZOOM & PARALLAX)
        // =========================================================================
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        
        // CLAMPS DO MAPA
        const MIN_SCALE = 1.0;
        const MAX_SCALE = 1.5; // Restrito a 1.5x para não perder a ilusão do pergaminho!

        const clampPan = () => {
            const maxPanX = 500 * scale; // Limites de rolagem lateral (Evita tirar o mapa da tela)
            const maxPanY = 300 * scale;
            translateX = Math.max(-maxPanX, Math.min(maxPanX, translateX));
            translateY = Math.max(-maxPanY, Math.min(maxPanY, translateY));
        };

        const updateTransform = () => {
            if (mapContainer) mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        };

        if (viewport) {
            viewport.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                clampPan();
                updateTransform();
            });

            window.addEventListener('mouseup', () => { isDragging = false; });
            
            viewport.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomSensitivity = 0.002;
                const delta = -e.deltaY * zoomSensitivity;
                const newScale = Math.min(Math.max(MIN_SCALE, scale + delta), MAX_SCALE); // Limite de Zoom rígido (1.0x - 2.0x)

                // Zoom focado no ponteiro do mouse
                const rect = viewport.getBoundingClientRect();
                const mouseX = e.clientX - rect.left - rect.width / 2;
                const mouseY = e.clientY - rect.top - rect.height / 2;

                const ratio = 1 - newScale / scale;
                translateX += (mouseX - translateX) * ratio;
                translateY += (mouseY - translateY) * ratio;

                scale = newScale;
                clampPan();
                updateTransform();
            });
        }

        // =========================================================================
        // ENGINE DE ROLAGEM DE TEXTURA & PARALLAX DO FOG
        // =========================================================================
        let fogTime = 0;
        const animateFog = () => {
            if (!this.container || this.container.style.display === 'none') {
                if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
                return;
            }
            fogTime += 0.3; // Velocidade do vento constante
            if (fogBase) {
                fogBase.style.backgroundPosition = `${translateX * 0.2 + fogTime * 0.5}px ${translateY * 0.2 + fogTime * 0.3}px`;
            }
            if (fogWisps) {
                fogWisps.style.backgroundPosition = `${translateX * 0.4 - fogTime * 0.8}px ${translateY * 0.4 + fogTime * 0.6}px`;
            }
            if (fogOverlay) {
                fogOverlay.style.backgroundPosition = `${translateX * 1.05 + fogTime * 1.2}px ${translateY * 1.05 + fogTime * 0.4}px`;
            }
            this.animationFrameId = requestAnimationFrame(animateFog);
        }
        animateFog();
        
        updateTransform();

        // Lógica de Seleção
        const nodes = this.container.querySelectorAll('.world-node');
        const defaultNode = this.container.querySelector(`[data-id="${selectedWorldId}"]`);
        if (defaultNode) defaultNode.classList.add('selected');

        nodes.forEach(node => {
            node.addEventListener('click', () => {
                nodes.forEach(n => n.classList.remove('selected'));
                node.classList.add('selected');
                selectedWorldId = (node as HTMLElement).dataset.id!;
            });
        });

        // Interação com os Pontos de Interesse (Mock para testar zoom/clique)
        const pois = this.container.querySelectorAll('.map-poi');
        pois.forEach(poi => {
            poi.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita acionar o clique da ilha ao clicar no nó
                alert(`Você clicou no local: ${(e.target as HTMLElement).getAttribute('data-poi')}`);
            });
        });

        // =========================================================================
        // TELA DE LOADING E INICIALIZAÇÃO DA IA
        // =========================================================================
        const loadingScreen = this.container.querySelector('#loading-screen-container') as HTMLElement;
        const funnyText = this.container.querySelector('#loading-funny-text') as HTMLElement;
        const techLog = this.container.querySelector('#loading-tech-log') as HTMLElement;
        const loadingSprite = this.container.querySelector('#loading-sprite') as HTMLImageElement;

        if (loadingSprite) {
            // Usa o ícone do jogo nativo como sprite de loading animado
            loadingSprite.src = new URL('../../../../../src-tauri/icons/game-icon-128.png', import.meta.url).href;
        }

        const funnyPhrases = [
            "Escovando os dentes dos Goblins...",
            "Polindo as Hitboxes...",
            "O Diretor Molor está terminando o café...",
            "Atores se posicionando no cenário...",
            "Afiando as espadas...",
            "Limpando o sangue do último aventureiro...",
            "Verificando se o Slime está gelatinoso...",
            "Os sonhos já vão começar..."
        ];

        let phraseIndex = 0;
        const phraseInterval = setInterval(() => {
            phraseIndex = (phraseIndex + 1) % funnyPhrases.length;
            if (funnyText) funnyText.textContent = funnyPhrases[phraseIndex]!;
        }, 2500);

        if (sonharBtn && cloudTransition) {
            if ((window as any).__TAURI_INTERNALS__) {
                listen<string>('loading-progress', (event) => {
                    if (techLog) techLog.textContent = event.payload;
                });

                listen('ollama-ready', () => {
                    logger.log('init', 'Sinal de IA Pronta recebido. Escondendo tela de loading.');
                    clearInterval(phraseInterval);
                    if (loadingScreen) {
                        loadingScreen.style.opacity = '0';
                        setTimeout(() => loadingScreen.style.display = 'none', 800);
                    }
                });
            } else {
                // Fallback: se estiver rodando no navegador normal, tira o loading de cara
                clearInterval(phraseInterval);
                if (loadingScreen) loadingScreen.style.display = 'none';
            }

            sonharBtn.addEventListener('click', () => {
                cloudTransition.classList.add('active');
                setTimeout(() => {
                    this.container.style.display = 'none';
                    this.onStartGameCallback(selectedWorldId); 
                }, 1200); 
            });
        }
    }

    private setupSaveSystem(): void {
        const btnExport = this.container.querySelector('#btn-export-save') as HTMLButtonElement;
        const btnImport = this.container.querySelector('#btn-import-save') as HTMLButtonElement;
        const btnConfirm = this.container.querySelector('#btn-confirm-import') as HTMLButtonElement;
        const ioArea = this.container.querySelector('#save-data-io') as HTMLTextAreaElement;
        
        if (!btnExport || !btnImport || !ioArea || !btnConfirm) return;

        const repo = new LocalStorageAdapter();

        btnExport.addEventListener('click', async () => {
            const data = await repo.loadProgress();
            if (data) {
                const saveStr = btoa(JSON.stringify(data));
                ioArea.value = saveStr;
                ioArea.style.display = 'block';
                btnConfirm.style.display = 'none';
                ioArea.select();
            } else {
                alert("Nenhum save encontrado para exportar.");
            }
        });

        btnImport.addEventListener('click', () => {
            ioArea.value = '';
            ioArea.style.display = 'block';
            btnConfirm.style.display = 'inline-block';
            ioArea.focus();
        });

        btnConfirm.addEventListener('click', async () => {
            const data = ioArea.value.trim();
            if (!data) return;
            
            try {
                const decoded = JSON.parse(atob(data));
                await repo.saveProgress(decoded);
                alert("Save importado com sucesso! Recarregando os sonhos...");
                window.location.reload();
            } catch (e) {
                alert("Código de save inválido ou corrompido!");
            }
        });
    }
}