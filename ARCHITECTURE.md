# System Architecture Document

## Project Overview
**Repository:** SmitVgithub/ibm
**Language:** nodejs
**Request:** Answer:
1. GitHub pages
2. Basic Information
3. Pure static
4. Plan HTML/CSS/JS

Only web based

## Architecture Diagram

```mermaid
flowchart TD
  subgraph Frontend ["Frontend Layer (Static Web)"] 
    Browser["🌐 Web Browser\nUser Client"]
    HTML["HTML Pages\nStructure & Content"]
    CSS["CSS Stylesheets\nStyling & Layout"]
    JS["JavaScript\nInteractivity & Logic"]
  end

  subgraph Hosting ["Hosting Layer"]
    GHP["GitHub Pages\nStatic File Hosting"]
    Repo["GitHub Repository\nSource Code & Assets"]
  end

  subgraph Delivery ["Content Delivery"]
    CDN["GitHub CDN\nGlobal Content Delivery"]
    Assets["Static Assets\nImages, Fonts, Files"]
  end

  Browser -->|"HTTP Request"| CDN
  CDN -->|"Serve Static Files"| GHP
  GHP -->|"Reads from"| Repo
  Repo -->|"Contains"| HTML
  Repo -->|"Contains"| CSS
  Repo -->|"Contains"| JS
  Repo -->|"Contains"| Assets
  HTML -->|"Rendered in"| Browser
  CSS -->|"Styled in"| Browser
  JS -->|"Executed in"| Browser
  Assets -->|"Loaded by"| Browser
```

### Request Flow

```mermaid
sequenceDiagram
  actor User as 👤 User
  participant Browser as 🌐 Web Browser
  participant CDN as GitHub CDN
  participant GHP as GitHub Pages
  participant Repo as GitHub Repository

  Note over User, Repo: Flow 1 - Initial Page Load
  User->>Browser: Navigate to GitHub Pages URL
  activate Browser
  Browser->>CDN: GET index.html
  activate CDN
  CDN->>GHP: Fetch static file
  activate GHP
  GHP->>Repo: Read index.html
  Repo-->>GHP: Return HTML content
  GHP-->>CDN: Serve HTML
  deactivate GHP
  CDN-->>Browser: Deliver index.html
  deactivate CDN
  Browser->>CDN: GET styles.css
  CDN-->>Browser: Deliver CSS
  Browser->>CDN: GET script.js
  CDN-->>Browser: Deliver JS
  Browser-->>User: Render complete page
  deactivate Browser

  Note over User, Repo: Flow 2 - Asset Loading
  User->>Browser: Interact with page
  activate Browser
  Browser->>CDN: GET images/assets
  activate CDN
  CDN-->>Browser: Deliver static assets
  deactivate CDN
  Browser-->>User: Display updated content
  deactivate Browser

  Note over User, Repo: Flow 3 - GitHub Pages Deployment
  participant Dev as 👨‍💻 Developer
  Dev->>Repo: git push to main branch
  activate Repo
  Repo->>GHP: Trigger Pages build
  activate GHP
  GHP->>GHP: Process static files
  GHP-->>CDN: Publish updated files
  deactivate GHP
  Repo-->>Dev: Deployment confirmed
  deactivate Repo
```

### Database Schema

```mermaid
erDiagram
  REPOSITORY {
    string repo_name PK
    string owner_username
    string branch_name
    string pages_url
    boolean pages_enabled
    datetime last_updated
  }

  HTML_PAGE {
    string page_id PK
    string filename
    string title
    string relative_path
    string content_type
    datetime last_modified
  }

  CSS_FILE {
    string file_id PK
    string filename
    string relative_path
    string media_type
    datetime last_modified
  }

  JS_FILE {
    string file_id PK
    string filename
    string relative_path
    boolean is_module
    datetime last_modified
  }

  STATIC_ASSET {
    string asset_id PK
    string filename
    string asset_type
    string relative_path
    integer file_size_kb
    datetime last_modified
  }

  DEPLOYMENT {
    string deploy_id PK
    string repo_name FK
    string commit_sha
    string status
    datetime deployed_at
    string pages_url
  }

  REPOSITORY ||--o{ HTML_PAGE : "contains"
  REPOSITORY ||--o{ CSS_FILE : "contains"
  REPOSITORY ||--o{ JS_FILE : "contains"
  REPOSITORY ||--o{ STATIC_ASSET : "contains"
  REPOSITORY ||--o{ DEPLOYMENT : "triggers"
  HTML_PAGE ||--o{ CSS_FILE : "links"
  HTML_PAGE ||--o{ JS_FILE : "includes"
  HTML_PAGE ||--o{ STATIC_ASSET : "references"
```

### Deployment Architecture

```mermaid
flowchart LR
  subgraph UserZone ["👤 User Zone"]
    Browser["🌐 Web Browser\nChrome / Firefox / Safari"]
  end

  subgraph Internet ["🌍 Internet"]
    DNS["DNS Resolution\ngithub.io domain"]
  end

  subgraph GitHubCloud ["☁️ GitHub Cloud Infrastructure"]
    subgraph CDNLayer ["CDN Layer"]
      CDN["GitHub CDN\nGlobal Edge Nodes\nHTTPS / TLS"]
    end

    subgraph PagesService ["GitHub Pages Service"]
      GHP["GitHub Pages\nStatic File Server\nAuto HTTPS"]
      Builder["Pages Build Engine\nStatic File Processor"]
    end

    subgraph RepoLayer ["Repository Layer"]
      Repo["GitHub Repository\nibm project\nmain branch"]
      Files["Static Files\nHTML / CSS / JS\nAssets"]
    end
  end

  subgraph DevZone ["👨‍💻 Developer Zone"]
    LocalDev["Local Development\nHTML/CSS/JS Editor"]
    GitCLI["Git CLI\nVersion Control"]
  end

  Browser -->|"HTTPS Request"| DNS
  DNS -->|"Resolves to"| CDN
  CDN -->|"Cache Miss: Fetch"| GHP
  GHP -->|"Reads"| Repo
  Repo -->|"Stores"| Files
  Files -->|"Served via"| GHP
  GHP -->|"Cached by"| CDN
  CDN -->|"HTTPS Response"| Browser
  LocalDev -->|"Edit files"| GitCLI
  GitCLI -->|"git push"| Repo
  Repo -->|"Triggers build"| Builder
  Builder -->|"Publishes to"| GHP
```

## Architecture Narrative

Answer:
1. GitHub pages
2. Basic Information
3. Pure static
4. Plan HTML/CSS/JS

Only web based


---
*Generated by Blueprint Brain 1.7*
