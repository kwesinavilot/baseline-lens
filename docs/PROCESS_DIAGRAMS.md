# Baseline Lens Process Diagrams

This document contains detailed process flow diagrams using Mermaid to illustrate how Baseline Lens works internally.

## Extension Lifecycle

```mermaid
sequenceDiagram
    participant VSCode
    participant Extension
    participant CDS as Compatibility Service
    participant AE as Analysis Engine
    participant UIS as UI Service
    participant FWS as File Watcher Service

    Note over VSCode,FWS: Extension Activation
    VSCode->>Extension: activate()
    Extension->>CDS: new CompatibilityDataService()
    Extension->>CDS: initialize()
    CDS->>CDS: Load web-features dataset
    CDS-->>Extension: Ready

    Extension->>AE: new AnalysisEngine()
    Extension->>AE: registerAnalyzer(CSS, JS, HTML)
    AE-->>Extension: Analyzers registered

    Extension->>UIS: new UIService(CDS)
    UIS->>UIS: Initialize decoration types
    UIS->>UIS: Register hover provider
    UIS-->>Extension: UI ready

    Extension->>FWS: new FileWatcherService(AE, UIS)
    Extension->>FWS: initialize()
    FWS->>FWS: Register document listeners
    FWS->>FWS: Analyze open documents
    FWS-->>Extension: File watcher ready

    Extension->>VSCode: Register commands
    Extension-->>VSCode: Extension activated

    Note over VSCode,FWS: Extension Deactivation
    VSCode->>Extension: deactivate()
    Extension->>FWS: dispose()
    Extension->>UIS: dispose()
    Extension-->>VSCode: Extension deactivated
```

## Document Analysis Flow

```mermaid
flowchart TD
    A[Document Change Event] --> B{File Type Supported?}
    B -->|No| C[Skip Analysis]
    B -->|Yes| D{File Size OK?}
    D -->|No| E[Skip - Too Large]
    D -->|Yes| F[Debounce Timer]
    
    F --> G[Start Analysis]
    G --> H[Get Appropriate Analyzer]
    H --> I{Analyzer Found?}
    I -->|No| J[Return Empty Result]
    I -->|Yes| K[Parse Document Content]
    
    K --> L{Parse Success?}
    L -->|No| M[Handle Parse Error]
    L -->|Yes| N[Detect Features]
    
    N --> O[For Each Feature]
    O --> P[Lookup Compatibility Data]
    P --> Q[Create DetectedFeature]
    Q --> R{More Features?}
    R -->|Yes| O
    R -->|No| S[Collect All Features]
    
    S --> T[Create Diagnostics]
    T --> U[Create Decorations]
    U --> V[Update UI Service]
    V --> W[Display Results]
    
    M --> X[Create Error Diagnostic]
    X --> V
    J --> V
    C --> Y[End]
    E --> Y
    W --> Y
```

## Feature Detection Process

```mermaid
flowchart LR
    subgraph "CSS Analysis"
        CSS1[Parse with PostCSS] --> CSS2[Detect Properties]
        CSS2 --> CSS3[Detect Selectors]
        CSS3 --> CSS4[Detect At-Rules]
        CSS4 --> CSS5[Detect Functions]
        CSS5 --> CSS6[Handle CSS-in-JS]
    end
    
    subgraph "JavaScript Analysis"
        JS1[Parse with Acorn] --> JS2[Strip TypeScript]
        JS2 --> JS3[Walk AST]
        JS3 --> JS4[Detect Web APIs]
        JS4 --> JS5[Detect Syntax Features]
        JS5 --> JS6[Detect Built-ins]
    end
    
    subgraph "HTML Analysis"
        HTML1[Parse with Parse5] --> HTML2[Detect Elements]
        HTML2 --> HTML3[Detect Attributes]
        HTML3 --> HTML4[Extract Inline CSS/JS]
        HTML4 --> HTML5[Analyze Embedded Code]
    end
    
    subgraph "Common Processing"
        COMMON1[Map to Web-Features ID] --> COMMON2[Lookup Baseline Status]
        COMMON2 --> COMMON3[Create DetectedFeature]
        COMMON3 --> COMMON4[Add Context Information]
    end
    
    CSS6 --> COMMON1
    JS6 --> COMMON1
    HTML5 --> COMMON1
```

## Compatibility Data Service Flow

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    
    Uninitialized --> Loading: initialize()
    Loading --> ProcessingData: web-features loaded
    Loading --> Error: load failed
    
    ProcessingData --> Ready: processing complete
    ProcessingData --> Error: processing failed
    
    Ready --> Ready: getFeatureStatus()
    Ready --> Ready: searchFeatures()
    Ready --> Ready: getFeatureDetails()
    Ready --> Ready: clearCache()
    
    Error --> Loading: retry initialize()
    
    Ready --> [*]: dispose()
    Error --> [*]: dispose()
```

## File Watcher Service State Machine

```mermaid
stateDiagram-v2
    [*] --> Inactive
    
    Inactive --> Initializing: initialize()
    Initializing --> Active: setup complete
    Initializing --> Error: setup failed
    
    state Active {
        [*] --> Idle
        Idle --> Debouncing: document change
        Debouncing --> Analyzing: timer expires
        Analyzing --> Idle: analysis complete
        Analyzing --> Error: analysis fails
        Error --> Idle: error handled
        
        Idle --> Analyzing: document open/save
        Debouncing --> Debouncing: more changes
        Debouncing --> Idle: document closed
    }
    
    Active --> Disposing: dispose()
    Error --> Disposing: dispose()
    Disposing --> [*]
```

## UI Service Update Flow

```mermaid
sequenceDiagram
    participant FWS as File Watcher Service
    participant UIS as UI Service
    participant VSCode as VS Code API
    participant HP as Hover Provider

    FWS->>UIS: updateDiagnostics(document, features)
    UIS->>UIS: createDiagnosticsFromFeatures()
    UIS->>VSCode: diagnosticCollection.set()
    
    FWS->>UIS: updateDecorations(document, features)
    UIS->>UIS: createDecorationsFromFeatures()
    UIS->>VSCode: editor.setDecorations()
    
    UIS->>HP: updateFeatures(document, features)
    HP->>HP: Store feature map for document
    
    Note over VSCode: User hovers over feature
    VSCode->>HP: provideHover(document, position)
    HP->>HP: findFeatureAtPosition()
    HP->>HP: createHoverContent()
    HP-->>VSCode: Return hover information
```

## Hover Provider Content Generation

```mermaid
flowchart TD
    A[Hover Request] --> B[Find Feature at Position]
    B --> C{Feature Found?}
    C -->|No| D[Return null]
    C -->|Yes| E[Check Cache]
    
    E --> F{Cache Hit?}
    F -->|Yes| G[Return Cached Content]
    F -->|No| H[Generate Content]
    
    H --> I[Create Header with Status Icon]
    I --> J[Add Status Badge]
    J --> K[Get Feature Description]
    K --> L[Add Baseline Information]
    L --> M[Create Browser Support Table]
    M --> N[Add Educational Content]
    N --> O[Generate Quick Links]
    O --> P[Add Recommendations]
    P --> Q[Cache Content]
    Q --> R[Return Hover Content]
    
    D --> S[End]
    G --> S
    R --> S
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Operation Start] --> B{Try Operation}
    B -->|Success| C[Return Result]
    B -->|Error| D[Catch Error]
    
    D --> E{Error Type?}
    E -->|Parse Error| F[Create Fallback Result]
    E -->|Timeout| G[Cancel Operation]
    E -->|Memory Error| H[Clear Caches]
    E -->|Network Error| I[Use Cached Data]
    E -->|Unknown| J[Log Error]
    
    F --> K[Create Error Diagnostic]
    G --> L[Show Timeout Message]
    H --> M[Reduce Analysis Scope]
    I --> N[Show Offline Mode]
    J --> O[Show Generic Error]
    
    K --> P[Continue with Partial Results]
    L --> P
    M --> P
    N --> P
    O --> P
    
    C --> Q[End]
    P --> Q
```

## Performance Optimization Flow

```mermaid
flowchart LR
    subgraph "Input Optimization"
        A1[File Size Check] --> A2[Content Validation]
        A2 --> A3[Language Detection]
    end
    
    subgraph "Processing Optimization"
        B1[Cache Lookup] --> B2[Debounced Analysis]
        B2 --> B3[Timeout Protection]
        B3 --> B4[Incremental Analysis]
    end
    
    subgraph "Output Optimization"
        C1[Result Caching] --> C2[UI Batching]
        C2 --> C3[Memory Cleanup]
    end
    
    A3 --> B1
    B4 --> C1
    
    subgraph "Monitoring"
        D1[Performance Metrics] --> D2[Memory Usage]
        D2 --> D3[Cache Statistics]
        D3 --> D4[Optimization Decisions]
    end
    
    C3 --> D1
    D4 --> A1
```

## Project Analysis Workflow

```mermaid
sequenceDiagram
    participant User
    participant Command
    participant AE as Analysis Engine
    participant VSCode as VS Code API
    participant Reporter as Report Generator

    User->>Command: Generate Baseline Report
    Command->>AE: analyzeProject()
    
    AE->>VSCode: workspace.findFiles()
    VSCode-->>AE: File URIs
    
    loop For each file
        AE->>VSCode: openTextDocument(uri)
        VSCode-->>AE: Document
        AE->>AE: analyzeDocument()
        AE->>AE: Collect features
    end
    
    AE->>AE: Generate summary statistics
    AE-->>Command: ProjectAnalysisResult
    
    Command->>Reporter: generateReport(result)
    Reporter->>Reporter: Format as JSON/Markdown
    Reporter-->>Command: Report content
    
    Command->>VSCode: showSaveDialog()
    VSCode-->>Command: Save location
    Command->>VSCode: writeFile(report)
    
    Command->>User: Show completion message
```

## Cache Management Strategy

```mermaid
flowchart TD
    A[Cache Operation] --> B{Cache Type?}
    
    B -->|Feature Cache| C[Feature Lookup Cache]
    B -->|Search Cache| D[Search Results Cache]
    B -->|Hover Cache| E[Hover Content Cache]
    B -->|Parse Cache| F[Parse Results Cache]
    
    C --> G{Cache Size > Limit?}
    D --> G
    E --> G
    F --> G
    
    G -->|Yes| H[LRU Eviction]
    G -->|No| I[Store in Cache]
    
    H --> J[Remove Oldest Entries]
    J --> I
    
    I --> K{TTL Expired?}
    K -->|Yes| L[Remove Entry]
    K -->|No| M[Return Cached Value]
    
    L --> N[Regenerate Value]
    N --> I
    M --> O[End]
```

## Extension Configuration Flow

```mermaid
sequenceDiagram
    participant User
    participant VSCode
    participant Extension
    participant Services

    User->>VSCode: Change settings
    VSCode->>Extension: onDidChangeConfiguration
    Extension->>Extension: Check if baseline-lens affected
    
    alt Configuration changed
        Extension->>Services: updateConfig(newConfig)
        Services->>Services: Apply new settings
        Services->>Services: Clear relevant caches
        Services->>Services: Restart analysis if needed
        Services-->>Extension: Configuration updated
        Extension->>User: Show restart notification (if needed)
    else No change
        Extension->>Extension: Ignore event
    end
```

## Analyzer Registration Process

```mermaid
flowchart LR
    A[Extension Activation] --> B[Create Analysis Engine]
    B --> C[Create CSS Analyzer]
    C --> D[Create JS Analyzer]
    D --> E[Create HTML Analyzer]
    
    E --> F[Register CSS Analyzer]
    F --> G[Register JS Analyzer]
    G --> H[Register HTML Analyzer]
    
    H --> I{Custom Analyzers?}
    I -->|Yes| J[Load Custom Analyzers]
    I -->|No| K[Analysis Engine Ready]
    
    J --> L[Register Custom Analyzers]
    L --> K
    
    K --> M[Start File Watching]
    
    subgraph "Analyzer Capabilities"
        N[Language Support]
        O[Feature Detection]
        P[Error Handling]
        Q[Performance Optimization]
    end
    
    F --> N
    G --> N
    H --> N
    L --> N
```

## Memory Management Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Initializing
    
    Initializing --> Normal: services started
    
    state Normal {
        [*] --> LowUsage
        LowUsage --> MediumUsage: cache growth
        MediumUsage --> HighUsage: continued growth
        HighUsage --> Cleanup: threshold exceeded
        Cleanup --> LowUsage: cleanup complete
        
        LowUsage --> LowUsage: normal operations
        MediumUsage --> MediumUsage: normal operations
        HighUsage --> HighUsage: normal operations
    }
    
    Normal --> Disposing: extension deactivate
    Disposing --> [*]: cleanup complete
    
    Normal --> Emergency: memory pressure
    Emergency --> Cleanup: force cleanup
    Cleanup --> Normal: memory recovered
```