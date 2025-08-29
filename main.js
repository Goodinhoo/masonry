/**
 * Galeria Tetris Avançada com Tema Gale
 * Sistema integrado com filtros, visualizador de imagens e layout tetris inteligente


/**
 * Estado da aplicação
 */
let currentSeason = "all";
let currentFilter = null; 
let filteredImages = [];
let currentImageIndex = 0;
let currentImages = [];
let isFullSize = false;

/**
 * Elementos DOM
 */
let seasonSelector, categoryFiltersContainer, loading, emptyState;
let imageViewerModal, modalImage, modalClose, navPrev, navNext;
let imageCounter, imageTitle, imageDescription, imageSeason;

/**
 * Image Data Manager Class - Versão Avançada
 */
class AdvancedImageDataManager {
  constructor() {
    this.imageData = null;
    this.allImages = [];
    this.processedImages = [];
  }

  /**
   * Load image data from Google Drive
   * @returns {Promise<void>}
   */
  async loadImageData() {
    try {
      // Usar proxy público para evitar CORS
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://drive.google.com/uc?export=download&id=1QVfvjf7HDC8rt-HftbTI0gjO0W3OeOzr')}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.imageData = await response.json();
      this.allImages = [];
      
      Object.keys(this.imageData).forEach(mainCategory => {
        Object.keys(this.imageData[mainCategory]).forEach(subCategory => {
          this.imageData[mainCategory][subCategory].forEach(image => {
            this.allImages.push({
              ...image,
              mainCategory: mainCategory,
              subCategory: subCategory,
              url: this.generateDriveUrl(image.id)
            });
          });
        });
      });
      
      console.log(`Loaded ${this.allImages.length} images from Google Drive`);
      
      // Processar imagens após carregamento
      this.processImages();
      
    } catch (error) {
      console.warn('Failed to load image data, using fallback:', error);
      this.allImages = this.getFallbackImages();
    }
  }

  /**
   * Processar e estruturar imagens para o sistema de filtros
   */
  processImages() {
    // Se os dados foram carregados via proxy, allImages já está preenchido
    if (this.allImages && this.allImages.length > 0) {
      this.processedImages = this.allImages.map((image, index) => {
        return {
          id: index + 1,
          googleDriveId: image.id,
          originalName: image.name,
          category: image.subCategory ? image.subCategory.toLowerCase() : 'unknown',
          title: image.subCategory || 'Unknown',
          season: image.mainCategory ? image.mainCategory.toLowerCase() : 'unknown',
          mainCategory: image.mainCategory,
          subCategory: image.subCategory,
          thumbnailUrl: this.generateThumbnailUrl(image.id), // Para galeria
          highQualityUrl: this.generateDriveUrl(image.id),   // Para modal
          url: this.generateDriveUrl(image.id),              // Compatibilidade
          src: this.generateThumbnailUrl(image.id),          // URL principal (thumbnail)
          alt: image.name || 'Image'
        };
      });
      return;
    }

    // Fallback: processar dados locais (código original mantido para compatibilidade)
    if (!this.imageData) {
      console.warn('No image data available to process');
      return;
    }

    this.allImages = [];
    this.processedImages = [];
    let imageId = 1;

    // Percorrer estrutura hierárquica
    Object.keys(this.imageData).forEach((mainCategory) => {
      Object.keys(this.imageData[mainCategory]).forEach((subCategory) => {
        this.imageData[mainCategory][subCategory].forEach((image) => {
          const processedImage = {
            id: imageId++,
            googleDriveId: image.id,
            originalName: image.name,
            category: subCategory.toLowerCase(),
            title: subCategory,
            season: mainCategory.toLowerCase(), 
            mainCategory: mainCategory,
            subCategory: subCategory,
            thumbnailUrl: this.generateThumbnailUrl(image.id), // Para galeria
            highQualityUrl: this.generateDriveUrl(image.id),   // Para modal
            url: this.generateDriveUrl(image.id),              // Compatibilidade
            src: this.generateThumbnailUrl(image.id),          // URL principal (thumbnail)
            alt: image.name
          };
          
          this.allImages.push(processedImage);
          this.processedImages.push(processedImage);
        });
      });
    });
  }

  /**
   * Obter todas as imagens processadas
   */
  getAllImages() {
    return this.processedImages;
  }

  /**
   * Filtrar imagens por temporada
   */
  getImagesBySeason(season) {
    if (season === 'all') return this.processedImages;
    return this.processedImages.filter(img => img.season === season);
  }

  /**
   * Filtrar imagens por categoria
   */
  getImagesByCategory(category, season = 'all') {
    let images = season === 'all' ? this.processedImages : this.getImagesBySeason(season);
    return images.filter(img => img.category === category);
  }

  /**
   * Obter todas as temporadas disponíveis
   */
  getAvailableSeasons() {
    const seasons = [...new Set(this.processedImages.map(img => img.season))];
    return seasons.sort();
  }

  /**
   * Obter todas as categorias disponíveis
   */
  getAvailableCategories(season = 'all') {
    const images = season === 'all' ? this.processedImages : this.getImagesBySeason(season);
    const categories = [...new Set(images.map(img => img.category))];
    return categories.sort();
  }
  /**
   * Gerar URL do Google Drive para exibição direta da imagem
   * 
   * Opções de URL do Google Drive:
   * 1. /thumbnail?id=ID&sz=w1000 - Imagem redimensionada (funciona melhor)
   * 2. /uc?id=ID - Download direto (pode não funcionar para todas as imagens)
   * 3. /file/d/ID/view - Página de visualização (não é imagem direta)
   */
  generateDriveUrl(fileId) {
    // URL principal: thumbnail com alta qualidade para modal
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2048`;
  }

  /**
   * Gerar URL thumbnail pequeno para galeria (carregamento rápido)
   */
  generateThumbnailUrl(fileId) {
    // URL thumbnail muito pequeno para carregamento ultra-rápido na galeria
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }

  /**
   * Gerar URL alternativo para fallback
   */
  generateAlternativeDriveUrl(fileId) {
    // URL alternativo: thumbnail com tamanho menor
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }

  /**
   * Gerar URL de download direto (para casos especiais)
   */
  generateDirectDownloadUrl(fileId) {
    // URL de download direto
    return `https://drive.google.com/uc?id=${fileId}`;
  }

  /**
   * Imagens de fallback
   */
  getFallbackImages() {
    return [
      {
        id: 1,
        googleDriveId: "fallback_1",
        originalName: "Fallback Image 1",
        url: "https://picsum.photos/400/300?random=1",
        src: "https://picsum.photos/400/300?random=1",
        category: "fallback",
        season: "test",
        title: "Fallback",
        alt: "Fallback Image 1"
      }
    ];
  }

  /**
   * Obter imagem aleatória
   */
  getRandomImage() {
    if (!this.processedImages || this.processedImages.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * this.processedImages.length);
    return this.processedImages[randomIndex];
  }

  /**
   * Verificar se dados estão carregados
   */
  isDataLoaded() {
    return this.processedImages && this.processedImages.length > 0;
  }

  /**
   * Formatar nome da imagem de YYYY-MM-DD_HH.MM.SS.png para DD / MM / YYYY
   * @param {string} fileName - Nome do arquivo original
   * @returns {string} - Data formatada ou nome original se não for data
   */
  formatImageDate(fileName) {
    // Regex para capturar padrão YYYY-MM-DD_HH.MM.SS.extensao
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})_\d{2}\.\d{2}\.\d{2}\.[a-zA-Z]{3,4}$/;
    const match = fileName.match(dateRegex);
    
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      return `${day} / ${month} / ${year}`;
    }
    
    // Se não corresponder ao padrão, retorna o nome original
    return fileName;
  }
}

/**
 * Sistema de Galeria Tetris Avançado com Filtros
 */
class AdvancedTetrisGallery {
  constructor() {
    this.container = document.getElementById("tetris-grid");
    this.imageManager = new AdvancedImageDataManager();
    this.imageCounter = 0;
    this.gridState = [];
    this.config = { columns: 5, rows: 12 }; // Aumentado de 8 para 12 linhas
    
    this.init();
  }

  /**
   * Ajustar grid dinamicamente baseado na quantidade de imagens
   */
  adjustGridSize(imageCount) {
    // Calcular quantas linhas são necessárias (estimativa: 2-3 imagens por linha)
    const estimatedRows = Math.ceil(imageCount / 2.5);
    const minRows = 8;  // Mínimo de 8 linhas
    const maxRows = 25; // Aumentado para suportar todas as imagens
    
    this.config.rows = Math.max(minRows, Math.min(maxRows, estimatedRows));
    
    console.log(`📏 Grid ajustado para ${imageCount} imagens: ${this.config.columns}x${this.config.rows}`);
    
    // Atualizar variáveis CSS dinamicamente
    const tetrisGrid = document.getElementById('tetris-grid');
    if (tetrisGrid) {
      tetrisGrid.style.setProperty('--grid-rows', this.config.rows);
      tetrisGrid.style.setProperty('--grid-columns', this.config.columns);
      console.log(`🎨 Variáveis CSS atualizadas: --grid-rows=${this.config.rows}, --grid-columns=${this.config.columns}`);
    }
    
    // Reinicializar grid state com o novo tamanho
    this.gridState = Array(this.config.rows)
      .fill(null)
      .map(() => Array(this.config.columns).fill(false));
  }

  async init() {
    // Inicializar elementos DOM
    this.initDOMElements();
    
    // Inicializar variáveis CSS do grid
    this.initializeGridCSS();
    
    // Inicializar grid state
    this.gridState = Array(this.config.rows)
      .fill(null)
      .map(() => Array(this.config.columns).fill(false));

    try {
      // Carregar dados das imagens
      await this.imageManager.loadImageData();
      
      // Configurar filtros
      this.setupFilters();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Iniciar carregamento automático
      this.startAutoLoading();
      
      // Esconder loading
      this.hideLoading();
      
    } catch (error) {
      console.error("Falha na inicialização:", error);
      this.showError("Erro ao carregar a galeria");
    }
  }

  /**
   * Inicializar variáveis CSS do grid
   */
  initializeGridCSS() {
    const tetrisGrid = document.getElementById('tetris-grid');
    if (tetrisGrid) {
      // Definir variáveis iniciais
      tetrisGrid.style.setProperty('--grid-columns', this.config.columns);
      tetrisGrid.style.setProperty('--grid-rows', this.config.rows);
      tetrisGrid.style.setProperty('--cell-size', '120px');
      tetrisGrid.style.setProperty('--grid-gap', '15px');
      
      console.log(`🎨 Grid CSS inicializado: ${this.config.columns}x${this.config.rows}`);
    }
  }

  /**
   * Inicializar elementos DOM
   */
  initDOMElements() {
    seasonSelector = document.getElementById("seasonSelector");
    categoryFiltersContainer = document.getElementById("categoryFilters");
    loading = document.getElementById("loading");
    emptyState = document.getElementById("emptyState");
    
    // Modal elements
    imageViewerModal = document.getElementById("imageViewerModal");
    modalImage = document.getElementById("modalImage");
    modalClose = document.getElementById("modalClose");
    navPrev = document.getElementById("navPrev");
    navNext = document.getElementById("navNext");
    imageCounter = document.getElementById("imageCounter");
    imageTitle = document.getElementById("imageTitle");
    imageDescription = document.getElementById("imageDescription");
    imageSeason = document.getElementById("imageSeason");
  }

  /**
   * Configurar filtros dinâmicos
   */
  setupFilters() {
    // Popular selector de temporadas
    const seasons = this.imageManager.getAvailableSeasons();
    seasons.forEach(season => {
      const option = document.createElement('option');
      option.value = season;
      // Garantir formatação consistente da temporada
      const seasonName = (season || 'unknown').toLowerCase();
      const formattedSeason = seasonName.charAt(0).toUpperCase() + seasonName.slice(1);
      option.textContent = `Infinity Nexus ${formattedSeason}`;
      seasonSelector.appendChild(option);
    });
    
    // Popular filtros de categoria
    this.updateCategoryFilters();
  }

  /**
   * Atualizar filtros de categoria baseado na temporada selecionada
   */
  updateCategoryFilters() {
    const categories = this.imageManager.getAvailableCategories(currentSeason);
    categoryFiltersContainer.innerHTML = '';
    
    categories.forEach(category => {
      const count = this.imageManager.getImagesByCategory(category, currentSeason).length;
      
      const filterBtn = document.createElement('button');
      filterBtn.className = `filter-btn ${currentFilter === category ? 'active' : ''}`;
      filterBtn.dataset.filter = category;
      
      filterBtn.innerHTML = `
        <span class="filter-name">${category}</span>
        <span class="filter-badge">${count}</span>
      `;
      
      filterBtn.addEventListener('click', () => this.setFilter(category));
      categoryFiltersContainer.appendChild(filterBtn);
    });
  }

  /**
   * Atualizar badge de contagem de imagens
   */
  updateImageCountBadge() {
    const imageCountText = document.getElementById('imageCountText');
    if (imageCountText) {
      const count = filteredImages.length;
      // Atualiza apenas o texto do número, mantendo o span "imagens encontradas" com espaço
      imageCountText.innerHTML = `${count} <span>&nbsp;Imagens</span>`;
      console.log(`🎫 Badge atualizado: ${count} imagens`);
    }
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Season selector
    seasonSelector.addEventListener('change', (e) => {
      currentSeason = e.target.value;
      currentFilter = null;
      this.updateCategoryFilters();
      this.filterAndDisplayImages();
    });
    
    // Modal controls
    modalClose?.addEventListener('click', () => this.closeImageViewer());
    navPrev?.addEventListener('click', () => this.navigateImage(-1));
    navNext?.addEventListener('click', () => this.navigateImage(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (imageViewerModal?.style.display === 'block') {
        switch (e.key) {
          case 'Escape': this.closeImageViewer(); break;
          case 'ArrowLeft': this.navigateImage(-1); break;
          case 'ArrowRight': this.navigateImage(1); break;
        }
      }
    });
  }

  // Métodos do sistema tetris e modal virão aqui...
  // (Implementação continua...)
  
  /**
   * Definir filtro de categoria
   */
  setFilter(category) {
    currentFilter = currentFilter === category ? null : category;
    this.updateCategoryFilters();
    this.filterAndDisplayImages();
  }

  /**
   * Filtrar e exibir imagens baseado nos filtros atuais
   */
  filterAndDisplayImages() {
    let images;
    
    // Se "all" está selecionado, mostrar todas as imagens
    if (currentSeason === 'all') {
      images = this.imageManager.getAllImages();
    } else {
      images = this.imageManager.getImagesBySeason(currentSeason);
    }
    
    // Aplicar filtro de categoria se ativo
    if (currentFilter) {
      images = images.filter(img => img.category === currentFilter);
    }
    
    filteredImages = images;
    currentImages = [...images];
    
    this.clearGrid();
    this.displayFilteredImages();
    
    // Atualizar badge de contagem
    this.updateImageCountBadge();
  }

  /**
   * Exibir imagens filtradas no grid tetris
   */
  displayFilteredImages() {
    if (filteredImages.length === 0) {
      this.showEmptyState();
      return;
    }
    
    this.hideEmptyState();
    
    // Determinar quantas imagens mostrar baseado na seleção
    let maxImages;
    if (currentSeason === 'all') {
      // Quando "Todas as Temporadas" está selecionado, mostrar TODAS as imagens
      maxImages = filteredImages.length;
      console.log(`🎆 Mostrando TODAS as ${filteredImages.length} imagens disponíveis`);
      console.log(`📏 Imagens totais encontradas:`, filteredImages.map(img => img.originalName));
    } else {
      // Para temporadas específicas, manter limite de 20
      maxImages = Math.min(20, filteredImages.length);
      console.log(`📊 Mostrando ${maxImages} de ${filteredImages.length} imagens da temporada`);
    }
    
    // Ajustar o tamanho do grid dinamicamente
    this.adjustGridSize(maxImages);
    
    console.log(`🎯 Iniciando carregamento de ${maxImages} imagens...`);
    
    // Adicionar imagens filtradas com pequeno delay
    filteredImages.slice(0, maxImages).forEach((image, index) => {
      setTimeout(() => {
        const size = this.getRandomSize();
        const position = this.findTopPosition(size);
        if (position) {
          this.createImageBlock(image, size, position);
          console.log(`✅ Imagem ${index + 1}/${maxImages} carregada: ${image.originalName}`);
        } else {
          console.warn(`⚠️ Não foi possível encontrar posição para imagem ${index + 1}: ${image.originalName}`);
        }
      }, index * 30); // Delay ainda menor para carregar mais rápido
    });
    
    // Log final após tempo suficiente para carregar todas
    setTimeout(() => {
      const loadedImages = this.container.querySelectorAll('.image-block').length;
      console.log(`🎉 Carregamento concluído: ${loadedImages} imagens exibidas no grid`);
      
      if (loadedImages < maxImages) {
        console.warn(`⚠️ Algumas imagens não puderam ser carregadas. Esperado: ${maxImages}, Carregado: ${loadedImages}`);
      }
    }, maxImages * 30 + 500);
  }

  /**
   * Obter tamanho aleatório para bloco
   */
  getRandomSize() {
    const sizes = [
      { width: 1, height: 1, weight: 40 },
      { width: 1, height: 2, weight: 25 },
      { width: 2, height: 1, weight: 25 },
      { width: 2, height: 2, weight: 10 }
    ];

    const totalWeight = sizes.reduce((sum, size) => sum + size.weight, 0);
    let random = Math.random() * totalWeight;

    for (const size of sizes) {
      random -= size.weight;
      if (random <= 0) {
        return { width: size.width, height: size.height };
      }
    }
    return { width: 1, height: 1 };
  }

  /**
   * Encontrar posição para colocar bloco
   */
  findTopPosition(size) {
    for (let row = 0; row <= this.config.rows - size.height; row++) {
      for (let col = 0; col <= this.config.columns - size.width; col++) {
        if (this.canPlaceAt(row, col, size)) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Verificar se pode colocar bloco na posição
   */
  canPlaceAt(row, col, size) {
    for (let r = row; r < row + size.height; r++) {
      for (let c = col; c < col + size.width; c++) {
        if (this.gridState[r] && this.gridState[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Criar bloco de imagem
   */
  createImageBlock(imageObj, size, position) {
    const block = document.createElement("div");
    block.className = `image-block image-block--${size.width}x${size.height}`;
    block.style.gridColumn = `${position.col + 1} / span ${size.width}`;
    block.style.gridRow = `${position.row + 1} / span ${size.height}`;

    const img = document.createElement("img");
    img.className = "image-block__image";
    img.src = imageObj.src || imageObj.url;
    img.alt = imageObj.alt || imageObj.originalName;
    img.loading = "lazy";

    // Error handling com fallback
    img.onerror = () => {
      console.warn(`Falha ao carregar imagem ${imageObj.googleDriveId}, tentando URL alternativo...`);
      
      // Tentar URL alternativo com tamanho ainda menor para galeria
      const fallbackUrl = `https://drive.google.com/thumbnail?id=${imageObj.googleDriveId}&sz=w150`;
      
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      } else {
        // Se o fallback também falhar, mostrar erro
        console.error(`Falha definitiva ao carregar imagem ${imageObj.googleDriveId}`);
        const errorMsg = document.createElement("div");
        errorMsg.className = "image-error";
        errorMsg.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <span>Erro ao carregar</span>
          <small>${this.imageManager.formatImageDate(imageObj.originalName)}</small>
        `;
        block.appendChild(errorMsg);
        img.style.display = 'none';
      }
    };

    // Overlay com informações
    const overlay = document.createElement("div");
    overlay.className = "image-block__overlay";
    overlay.innerHTML = `
      <span class="image-name">${this.imageManager.formatImageDate(imageObj.originalName || imageObj.name)}</span>
      <span class="image-category">${imageObj.title}</span>
      <span class="image-size">${size.width}×${size.height}</span>
    `;

    block.appendChild(img);
    block.appendChild(overlay);
    
    // Click para abrir modal
    block.addEventListener('click', () => this.openImageViewer(imageObj));
    
    this.container.appendChild(block);
    this.markCellsOccupied(position, size);
  }

  /**
   * Marcar células como ocupadas
   */
  markCellsOccupied(position, size) {
    for (let r = position.row; r < position.row + size.height; r++) {
      for (let c = position.col; c < position.col + size.width; c++) {
        if (this.gridState[r]) {
          this.gridState[r][c] = true;
        }
      }
    }
  }

  /**
   * Limpar grid
   */
  clearGrid() {
    this.container.innerHTML = '';
    this.gridState = Array(this.config.rows)
      .fill(null)
      .map(() => Array(this.config.columns).fill(false));
    
    // Garantir que as variáveis CSS estão atualizadas
    const tetrisGrid = document.getElementById('tetris-grid');
    if (tetrisGrid) {
      tetrisGrid.style.setProperty('--grid-rows', this.config.rows);
      tetrisGrid.style.setProperty('--grid-columns', this.config.columns);
    }
  }

  /**
   * Iniciar carregamento automático
   */
  async startAutoLoading() {
    if (!this.imageManager.isDataLoaded()) {
      console.warn("Dados não carregados ainda");
      return;
    }

    this.filterAndDisplayImages();
  }

  /**
   * Abrir visualizador de imagem
   */
  openImageViewer(image) {
    currentImageIndex = currentImages.findIndex(img => img.id === image.id);
    this.updateModalImage(image);
    imageViewerModal.style.display = 'block';
  }

  /**
   * Fechar visualizador
   */
  closeImageViewer() {
    imageViewerModal.style.display = 'none';
  }

  /**
   * Navegar entre imagens
   */
  navigateImage(direction) {
    currentImageIndex += direction;
    if (currentImageIndex < 0) currentImageIndex = currentImages.length - 1;
    if (currentImageIndex >= currentImages.length) currentImageIndex = 0;
    
    this.updateModalImage(currentImages[currentImageIndex]);
  }

  /**
   * Atualizar imagem do modal
   */
  updateModalImage(image) {
    // Usar alta qualidade no modal
    const modalUrl = image.highQualityUrl || image.url;
    console.log(`🔍 Modal carregando: ${modalUrl}`);
    modalImage.src = modalUrl;
    modalImage.alt = image.alt || image.originalName;
    imageTitle.textContent = this.imageManager.formatImageDate(image.originalName || image.name);
    imageDescription.textContent = `Jogador: ${image.title}`;
    // Garantir formatação consistente da temporada
    const seasonName = (image.season || 'unknown').toLowerCase();
    const formattedSeason = seasonName.charAt(0).toUpperCase() + seasonName.slice(1);
    imageSeason.textContent = `Infinity Nexus ${formattedSeason}`;
    imageCounter.textContent = `${currentImageIndex + 1} de ${currentImages.length}`;
  }

  /**
   * Mostrar/esconder estados
   */
  hideLoading() {
    loading.style.display = 'none';
  }

  showEmptyState() {
    emptyState.style.display = 'block';
  }

  hideEmptyState() {
    emptyState.style.display = 'none';
  }

  showError(message) {
    console.error(message);
    this.hideLoading();
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
  try {
    window.gallery = new AdvancedTetrisGallery();
    console.log("🎆 Galeria Tetris Avançada inicializada com sucesso!");
    
    // Funções de debug globais para testar URLs
    window.testImageUrl = function(fileId) {
      const urls = {
        thumbnail_ultra_high: `https://drive.google.com/thumbnail?id=${fileId}&sz=w2048`,
        thumbnail_high: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        thumbnail_medium: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
        thumbnail_small: `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`,
        thumbnail_tiny: `https://drive.google.com/thumbnail?id=${fileId}&sz=w150`,
        direct_download: `https://drive.google.com/uc?id=${fileId}`,
        view_page: `https://drive.google.com/file/d/${fileId}/view`
      };
      
      console.log(`🔍 Testando URLs para fileId: ${fileId}`);
      Object.entries(urls).forEach(([type, url]) => {
        console.log(`${type}: ${url}`);
      });
      
      return urls;
    };
    
    window.checkImageLoad = function(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ success: true, dimensions: { width: img.width, height: img.height } });
        img.onerror = () => resolve({ success: false, error: 'Failed to load' });
        img.src = url;
      });
    };
    
    console.log("🛠️ Debug: Use testImageUrl('ID') e checkImageLoad('URL') para testar imagens");
    
    // Funções de debug adicionais para a galeria
    window.debugGallery = {
      // Verificar quantas imagens estão carregadas
      getLoadedImagesCount: () => {
        const loadedImages = document.querySelectorAll('.image-block').length;
        console.log(`📊 Imagens carregadas no grid: ${loadedImages}`);
        return loadedImages;
      },
      
      // Verificar total de imagens disponíveis
      getTotalImagesCount: () => {
        if (window.gallery && window.gallery.imageManager) {
          const total = window.gallery.imageManager.getAllImages().length;
          console.log(`📊 Total de imagens disponíveis: ${total}`);
          return total;
        }
        console.warn('Galeria não inicializada');
        return 0;
      },
      
      // Verificar imagens filtradas
      getFilteredImagesCount: () => {
        console.log(`📊 Imagens filtradas: ${filteredImages.length}`);
        console.log('Temporada atual:', currentSeason);
        console.log('Filtro atual:', currentFilter);
        return filteredImages.length;
      },
      
      // Forçar recarregamento da galeria
      forceReload: () => {
        if (window.gallery) {
          console.log('🔄 Forçando recarregamento...');
          window.gallery.filterAndDisplayImages();
        }
      },
      
      // Verificar configuração do grid
      getGridConfig: () => {
        if (window.gallery) {
          console.log('Grid config:', window.gallery.config);
          return window.gallery.config;
        }
        return null;
      },
      
      // Testar com todas as temporadas
      testAllSeasons: () => {
        console.log('🧪 Testando "Todas as Temporadas"...');
        currentSeason = 'all';
        currentFilter = null;
        if (window.gallery) {
          window.gallery.filterAndDisplayImages();
        }
      },
      
      // Listar todas as imagens disponíveis
      listAllImages: () => {
        if (window.gallery && window.gallery.imageManager) {
          const images = window.gallery.imageManager.getAllImages();
          console.log('📋 Todas as imagens disponíveis:');
          images.forEach((img, index) => {
            console.log(`${index + 1}. ${img.originalName} (${img.season} - ${img.category})`);
          });
          return images;
        }
        return [];
      },
      
      // Debug URLs das imagens
      checkImageUrls: () => {
        if (window.gallery && window.gallery.imageManager) {
          const images = window.gallery.imageManager.getAllImages();
          console.log('🔍 URLs das imagens:');
          images.slice(0, 3).forEach((img, index) => {
            console.log(`Imagem ${index + 1}: ${img.originalName}`);
            console.log(`  - Thumbnail (galeria): ${img.thumbnailUrl || img.src}`);
            console.log(`  - Alta qualidade (modal): ${img.highQualityUrl || img.url}`);
            console.log(`  - URL compatíbilidade: ${img.url}`);
          });
          return images;
        }
        return [];
      }
    };
    
    console.log('🛠️ Funções de debug disponíveis em window.debugGallery');
    console.log('📝 Use debugGallery.testAllSeasons() para testar se todas as imagens aparecem');
    
  } catch (error) {
    console.error("Falha ao inicializar:", error);
  }
});
