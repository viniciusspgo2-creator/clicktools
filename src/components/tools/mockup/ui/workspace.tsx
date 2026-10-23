"use client";
import { useEffect as ReactUseEffect, useState, type ReactNode } from "react";
import {
  ImagePlus,
  Images,
  Coffee,
  Layers,
  Settings2,
  Sun,
  Moon,
  Undo2,
  Redo2,
  FolderOpen,
  Download,
  ArrowLeft,
  MousePointer2,
  Move,
  Rotate3D,
  Scaling,
  Hand,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Grid3X3,
  Maximize,
  Play,
  Pause,
  Upload,
  Save,
  MessageCircle,
  X,
  Check,
  Camera,
  Lightbulb,
} from "lucide-react";
import { useMockupStore, type MugState, type ArtState } from "../state/store";
import { useToolsStore } from "@/lib/tools-store";
import {
  ArtPanel,
  CameraPanel,
  LightPanel,
  MugPanel,
  ScenePanel,
} from "./panels";
import { FXPanel, MultiMugPanel } from "./panels-extra";
import { Section, ColorRow, SliderRow, ToggleRow } from "./controls";
import { MODELS } from "../scene/model-geometry";
import { CAMERA_PRESETS, FLOOR_OPTIONS } from "../lib/config";
import { getArtImage, loadArtFile, makeSampleArt } from "../lib/art-registry";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";
import { PrintLayersPanel } from "./print-layers-panel";
import { HDRIPanel } from "./hdri-panel";
import { PremiumBackgrounds } from "./premium-backgrounds";
import { saveCurrentProject } from "./projects-dialog";
import { exportImage, downloadBlob } from "../exporters/image-exporter";
import {
  exportPortableProject,
  importPortableProject,
} from "../lib/portable-project";
import "./workspace.css";

type Tab = "arts" | "backgrounds" | "models" | "layers" | "scene";
const NAV = [
  { id: "arts", label: "Artes", icon: ImagePlus },
  { id: "backgrounds", label: "Fundos", icon: Images },
  { id: "models", label: "Bases", icon: Coffee },
  { id: "layers", label: "Camadas", icon: Layers },
  { id: "scene", label: "Cena", icon: Lightbulb },
] as const;
function ToolButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`cg-icon ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
export function Workspace({
  viewport,
  onUpload,
}: {
  viewport: ReactNode;
  onUpload: () => void;
}) {
  const st = useMockupStore();
  const [tab, setTab] = useState<Tab>("arts");
  const [light, setLight] = useState(false);
  const [drawer, setDrawer] = useState<"library" | "properties" | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const active = st.selectedIds[0] ?? "hero";
  const selected =
    active === "hero" ? st.mug : st.companions.find((c) => c.id === active);
  const art =
    active === "hero"
      ? st.art
      : (st.companions.find((c) => c.id === active)?.art ?? st.art);
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  };
  async function safe(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    const r = await exportImage({
      width: 1080,
      height: 1080,
      format: "png",
      quality: 1,
      transparent: false,
    });
    const file = new File([r.blob], r.filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: st.projectName });
    } else {
      downloadBlob(r.blob, r.filename);
      notify("Imagem baixada. Anexe no WhatsApp para enviar ao cliente.");
    }
  }
  function patchArt(p: Partial<ArtState>) {
    st.patchObjectArt(active, p);
  }
  return (
    <div className={`cg-workspace ${light ? "cg-light" : ""}`}>
      <header className="cg-topbar">
        <ToolButton
          label="Voltar às ferramentas"
          onClick={() => useToolsStore.getState().setActiveTool("inicio")}
        >
          <ArrowLeft />
        </ToolButton>
        <div className="cg-brand">
          <span className="cg-logo">
            <Coffee />
          </span>
          <span>
            Click<span className="cg-orange">&</span>Gruda
            <small>MOCKUP STUDIO</small>
          </span>
        </div>
        <span className="cg-divider" />
        <input
          aria-label="Nome do projeto"
          className="cg-project-name"
          value={st.projectName}
          onChange={(e) => st.setProjectName(e.target.value)}
        />
        <div className="cg-history">
          <ToolButton
            label="Desfazer · Ctrl+Z"
            onClick={st.undo}
            disabled={!st.past.length}
          >
            <Undo2 />
          </ToolButton>
          <ToolButton
            label="Refazer · Ctrl+Y"
            onClick={st.redo}
            disabled={!st.future.length}
          >
            <Redo2 />
          </ToolButton>
        </div>
        <div className="cg-zoom-top">
          <button
            onClick={() => st.setZoom(st.zoom - 10)}
            aria-label="Diminuir zoom"
          >
            −
          </button>
          <span>{Math.round(st.zoom)}%</span>
          <button
            onClick={() => st.setZoom(st.zoom + 10)}
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
        <ToolButton
          label={light ? "Tema escuro" : "Tema claro"}
          onClick={() => setLight(!light)}
        >
          {light ? <Moon /> : <Sun />}
        </ToolButton>
        <ToolButton
          label="Projetos salvos"
          onClick={() => st.setProjectsOpen(true)}
        >
          <FolderOpen />
        </ToolButton>
        <ToolButton
          label="Salvar projeto"
          disabled={busy}
          onClick={() =>
            safe(async () => {
              await saveCurrentProject("working-project", st.projectName);
              notify("Projeto salvo neste dispositivo.");
            })
          }
        >
          <Save />
        </ToolButton>
        <button className="cg-export" onClick={() => st.setExportOpen(true)}>
          <Download />
          <span>Exportar</span>
        </button>
      </header>
      <div className="cg-body">
        <nav className="cg-rail" aria-label="Biblioteca do estúdio">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "is-active" : ""}
              onClick={() => {
                setTab(n.id);
                setDrawer("library");
              }}
              aria-label={n.label}
            >
              <n.icon />
              <span>{n.label}</span>
            </button>
          ))}
          <div className="cg-rail-bottom">
            <ToolButton
              label="Compartilhar imagem"
              disabled={busy}
              onClick={() => safe(share)}
            >
              <MessageCircle />
            </ToolButton>
          </div>
        </nav>
        {drawer && (
          <button
            className="cg-scrim"
            aria-label="Fechar painel"
            onClick={() => setDrawer(null)}
          />
        )}
        <aside
          className={`cg-library cg-panel ${drawer === "library" ? "cg-drawer-open" : ""}`}
          aria-label="Biblioteca e recursos"
        >
          <div className="cg-panel-heading">
            <div>
              <small>SEU ESTÚDIO CRIATIVO</small>
              <h2>{NAV.find((n) => n.id === tab)?.label}</h2>
            </div>
            <button
              className="cg-mobile-close cg-icon"
              aria-label="Fechar biblioteca"
              onClick={() => setDrawer(null)}
            >
              <X />
            </button>
          </div>
          {tab === "arts" && (
            <>
              <button className="cg-upload" onClick={onUpload}>
                <Upload />
                <strong>Adicionar arte</strong>
                <span>Arraste um arquivo ou cole com Ctrl+V</span>
              </button>
              <div className="cg-asset-preview">
                {getArtImage(art.imageId)?.source && <ArtPreview art={art} />}
                <strong>{art.name || "Sua próxima ideia começa aqui"}</strong>
                <span>
                  {art.width
                    ? `${art.width} × ${art.height} px`
                    : "PNG, JPG, WebP, SVG e AVIF"}
                </span>
              </div>
              <button
                className="cg-secondary"
                onClick={() => {
                  const e = makeSampleArt();
                  st.patchObjectArt(active, {
                    imageId: e.id,
                    name: e.name,
                    width: e.naturalWidth,
                    height: e.naturalHeight,
                  });
                }}
              >
                Experimentar arte de exemplo
              </button>
              <p className="cg-hint">
                A arte será aplicada à caneca selecionada. Use o modo “Mover
                arte” para arrastá-la diretamente na peça.
              </p>
              <Section title="Arquivo de projeto" icon={FolderOpen}>
                <button
                  className="cg-secondary"
                  onClick={() =>
                    safe(async () => {
                      await exportPortableProject();
                      notify("Projeto completo baixado com as imagens.");
                    })
                  }
                >
                  Baixar projeto .cgstudio
                </button>
                <label className="cg-file-label">
                  Abrir arquivo de projeto
                  <input
                    type="file"
                    accept=".cgstudio,application/json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        safe(async () => {
                          await importPortableProject(f);
                          notify("Projeto aberto.");
                        });
                      e.target.value = "";
                    }}
                  />
                </label>
              </Section>
            </>
          )}
          {tab === "backgrounds" && (
            <>
              <PremiumBackgrounds notify={notify} />
              <ScenePanel />
            </>
          )}
          {tab === "models" && (
            <>
              <p className="cg-hint">
                Escolha a forma da peça selecionada. A arte acompanha a mudança.
              </p>
              <div className="cg-model-grid">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={selected?.model === m.id ? "is-active" : ""}
                    onClick={() => st.patchObject(active, { model: m.id })}
                  >
                    <Coffee
                      style={{
                        transform: `scale(${m.id === "tea" ? "1.25,.8" : m.id === "long" || m.id === "squeeze" ? ".75,1.35" : "1"})`,
                      }}
                    />
                    <strong>{m.label}</strong>
                    <small>{m.desc}</small>
                    {selected?.model === m.id && (
                      <Check className="cg-model-check" />
                    )}
                  </button>
                ))}
              </div>
              <Section title="Bases de apoio" icon={Layers} defaultOpen>
                <div className="cg-pills">
                  {FLOOR_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      className={st.bg.floor === f.value ? "is-active" : ""}
                      onClick={() => st.patch("bg", { floor: f.value })}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}
          {tab === "layers" && (
            <>
              <div className="cg-section-line">
                <span>{1 + st.companions.length} objetos</span>
                <button
                  onClick={() => {
                    st.duplicateSelected();
                  }}
                >
                  + Duplicar
                </button>
              </div>
              <p className="cg-hint">
                Shift + clique seleciona várias peças. A ordem de camadas ajusta
                a profundidade real da cena.
              </p>
              <div className="cg-layers">
                {[
                  ...new Set([
                    ...st.layerOrder,
                    "hero",
                    ...st.companions.map((c) => c.id),
                  ]),
                ]
                  .reverse()
                  .map((id) => {
                    const o =
                      id === "hero"
                        ? st.mug
                        : st.companions.find((c) => c.id === id);
                    if (!o) return null;
                    return (
                      <div
                        className={`cg-layer ${st.selectedIds.includes(id) ? "is-active" : ""}`}
                        key={id}
                      >
                        <button
                          className="cg-layer-name"
                          onClick={(e) =>
                            st.select(id, e.shiftKey || e.ctrlKey)
                          }
                        >
                          <Coffee />
                          <span>{o.name || "Caneca"}</span>
                        </button>
                        <ToolButton
                          label={
                            o.hidden ? "Mostrar objeto" : "Esconder objeto"
                          }
                          onClick={() =>
                            st.patchObject(id, { hidden: !o.hidden })
                          }
                        >
                          {o.hidden ? <EyeOff /> : <Eye />}
                        </ToolButton>
                        <ToolButton
                          label={
                            o.locked ? "Destravar objeto" : "Travar objeto"
                          }
                          onClick={() =>
                            st.patchObject(id, { locked: !o.locked })
                          }
                        >
                          {o.locked ? <Lock /> : <Unlock />}
                        </ToolButton>
                        <div className="cg-layer-order">
                          <button
                            aria-label="Trazer para frente"
                            onClick={() => st.reorderLayer(id, 1)}
                          >
                            <ChevronUp />
                          </button>
                          <button
                            aria-label="Enviar para trás"
                            onClick={() => st.reorderLayer(id, -1)}
                          >
                            <ChevronDown />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="cg-pills">
                <button onClick={() => st.alignSelected("left")}>
                  Esquerda
                </button>
                <button onClick={() => st.alignSelected("center")}>
                  Centro
                </button>
                <button onClick={() => st.alignSelected("right")}>
                  Direita
                </button>
                <button onClick={() => st.alignSelected("distribute")}>
                  Distribuir
                </button>
              </div>
            </>
          )}
          {tab === "scene" && (
            <>
              <LightPanel />
              <HDRIPanel />
              <CameraPanel />
              <FXPanel />
              <MultiMugPanel />
              <button className="cg-secondary" onClick={() => st.resetAll()}>
                Recomeçar a cena
              </button>
            </>
          )}
        </aside>
        <main className="cg-canvas" aria-label="Canvas 3D">
          <div className="cg-canvas-toolbar">
            {(
              [
                { id: "select", label: "Selecionar · V", icon: MousePointer2 },
                { id: "move", label: "Mover · G", icon: Move },
                { id: "rotate", label: "Girar em 3 eixos · E", icon: Rotate3D },
                { id: "scale", label: "Escalar · S", icon: Scaling },
                { id: "art", label: "Mover arte · A", icon: ImagePlus },
                { id: "pan", label: "Navegar · H", icon: Hand },
              ] as const
            ).map((t) => (
              <ToolButton
                key={t.id}
                label={t.label}
                onClick={() => st.setTool(t.id)}
                active={st.tool === t.id}
              >
                <t.icon />
              </ToolButton>
            ))}
            <span className="cg-divider" />
            <ToolButton
              label="Duplicar · Ctrl+D"
              onClick={st.duplicateSelected}
            >
              <Copy />
            </ToolButton>
            <ToolButton label="Apagar · Delete" onClick={st.deleteSelected}>
              <Trash2 />
            </ToolButton>
          </div>
          <div className="cg-viewport">{viewport}</div>
          <div className="cg-canvas-label">
            <span className="cg-live-dot" />
            PRÉVIA 3D EM TEMPO REAL
          </div>
          <div className="cg-scene-presets">
            <label>Composição</label>
            <div>
              {(
                [
                  ["solo", "1 peça"],
                  ["pair", "Par"],
                  ["trio", "Trio"],
                  ["row", "Fileira"],
                  ["fan", "Leque"],
                  ["stack", "Empilhadas"],
                  ["gift", "Kit presente"],
                ] as const
              ).map(([id, name]) => (
                <button key={id} onClick={() => st.compose(id)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="cg-camera-strip">
            {CAMERA_PRESETS.filter((p) =>
              ["frente", "tres-quartos", "costas", "topo"].includes(p.id),
            ).map((p) => (
              <button key={p.id} onClick={() => st.applyCameraPreset(p)}>
                {p.label}
              </button>
            ))}
            <button onClick={st.frameAll}>
              <Maximize />
              Enquadrar
            </button>
          </div>
          {notice && (
            <div className="cg-notice" role="status">
              {notice}
            </div>
          )}
        </main>
        <aside
          className={`cg-properties cg-panel ${drawer === "properties" ? "cg-drawer-open" : ""}`}
          aria-label="Propriedades da caneca selecionada"
        >
          <div className="cg-panel-heading">
            <div>
              <small>
                {st.selectedIds.length > 1
                  ? `${st.selectedIds.length} PEÇAS SELECIONADAS`
                  : "PROPRIEDADES"}
              </small>
              <h2>{selected?.name || "Selecione uma peça"}</h2>
            </div>
            <button
              className="cg-mobile-close cg-icon"
              aria-label="Fechar propriedades"
              onClick={() => setDrawer(null)}
            >
              <X />
            </button>
          </div>
          {selected ? (
            <>
              <Section title="Transformar" icon={Move} defaultOpen>
                <div className="cg-pills">
                  {[
                    ["Em pé", 0, 0],
                    ["Deitada", 90, 0],
                    ["Invertida", 180, 0],
                    ["Inclinada", 20, 25],
                  ].map(([name, x, z]) => (
                    <button
                      key={name}
                      onClick={() =>
                        st.patchObject(active, {
                          tiltX: Number(x),
                          tiltZ: Number(z),
                        })
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="cg-numeric-grid">
                  {(
                    [
                      "posX",
                      "posY",
                      "posZ",
                      "tiltX",
                      "rotationY",
                      "tiltZ",
                      "scale",
                    ] as const
                  ).map((k, i) => (
                    <label key={k}>
                      {
                        [
                          "Posição X",
                          "Altura Y",
                          "Profundidade Z",
                          "Rotação X",
                          "Rotação Y",
                          "Rotação Z",
                          "Escala",
                        ][i]
                      }
                      <input
                        aria-label={
                          [
                            "Posição X",
                            "Altura Y",
                            "Profundidade Z",
                            "Rotação X",
                            "Rotação Y",
                            "Rotação Z",
                            "Escala",
                          ][i]
                        }
                        type="number"
                        step={k === "scale" ? 0.05 : 0.5}
                        value={Number(
                          (selected[k] ?? (k === "scale" ? 1 : 0)).toFixed(2),
                        )}
                        onChange={(e) => {
                          if (Number.isFinite(e.target.valueAsNumber))
                            st.patchObject(active, {
                              [k]: e.target.valueAsNumber,
                            });
                        }}
                      />
                    </label>
                  ))}
                </div>
                <ToggleRow
                  label="Encaixe magnético"
                  checked={st.snapEnabled}
                  onChange={st.setSnap}
                />
                <ToggleRow
                  label="Travar objeto"
                  checked={!!selected.locked}
                  onChange={(locked) => st.patchObject(active, { locked })}
                />
              </Section>
              <Section title="Cerâmica e acabamento" icon={Coffee} defaultOpen>
                <ColorRow
                  label="Cor do corpo"
                  value={selected.bodyColor ?? "#ffffff"}
                  onChange={(bodyColor) =>
                    st.patchObject(active, { bodyColor })
                  }
                />
                <ColorRow
                  label="Cor da base"
                  value={selected.baseColor ?? selected.bodyColor ?? "#ffffff"}
                  onChange={(baseColor) =>
                    st.patchObject(active, { baseColor })
                  }
                />
                <ColorRow
                  label="Cor do interior"
                  value={selected.interiorColor ?? "#ffffff"}
                  onChange={(interiorColor) =>
                    st.patchObject(active, { interiorColor })
                  }
                />
                <ColorRow
                  label="Cor da alça / tampa"
                  value={selected.handleColor ?? "#ffffff"}
                  onChange={(handleColor) =>
                    st.patchObject(active, { handleColor })
                  }
                />
                <SliderRow
                  label="Verniz"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selected.clearcoat ?? 1}
                  onChange={(clearcoat) =>
                    st.patchObject(active, { clearcoat })
                  }
                />
                <SliderRow
                  label="Rugosidade"
                  min={0.04}
                  max={1}
                  step={0.01}
                  value={selected.roughness ?? 0.16}
                  onChange={(roughness) =>
                    st.patchObject(active, { roughness })
                  }
                />
                <SliderRow
                  label="Reflexo"
                  min={0}
                  max={2}
                  step={0.01}
                  value={selected.reflection ?? 0.8}
                  onChange={(reflection) =>
                    st.patchObject(active, { reflection })
                  }
                />
                <ToggleRow
                  label="Preservar cor da arte"
                  checked={selected.faithfulColor ?? true}
                  onChange={(faithfulColor) =>
                    st.patchObject(active, { faithfulColor })
                  }
                />
                <div className="cg-pills">
                  {(["white", "accent", "magic"] as const).map((v, i) => (
                    <button
                      key={v}
                      className={selected.variant === v ? "is-active" : ""}
                      onClick={() => st.patchObject(active, { variant: v })}
                    >
                      {["Branca", "Colorida", "Mágica"][i]}
                    </button>
                  ))}
                </div>
                {selected.variant === "magic" && (
                  <>
                    <SliderRow
                      label="Revelação térmica"
                      value={selected.magicHeat}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(magicHeat) =>
                        st.patchObject(active, { magicHeat })
                      }
                    />
                    {active === "hero" && <MugPanel />}
                  </>
                )}
              </Section>
              <Section title="Ajustes da arte" icon={ImagePlus} defaultOpen>
                {(
                  [
                    "brightness",
                    "contrast",
                    "saturation",
                    "vibrance",
                    "temperature",
                    "sharpness",
                    "opacity",
                  ] as const
                ).map((k, i) => (
                  <SliderRow
                    key={k}
                    label={
                      [
                        "Brilho",
                        "Contraste",
                        "Saturação",
                        "Vibração",
                        "Temperatura",
                        "Nitidez",
                        "Opacidade",
                      ][i]
                    }
                    min={k === "sharpness" || k === "opacity" ? 0 : -1}
                    max={1}
                    step={0.01}
                    value={art[k] ?? (k === "opacity" ? 1 : 0)}
                    onChange={(v) => patchArt({ [k]: v })}
                  />
                ))}
                <SliderRow
                  label="Sangria (cm)"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={art.bleed ?? 0}
                  onChange={(bleed) => patchArt({ bleed })}
                />
                <div className="cg-pills">
                  <button onClick={() => patchArt(NEUTRAL_ADJUSTMENTS)}>
                    Resetar ajustes
                  </button>
                  <button
                    aria-pressed={st.compareArt}
                    onClick={() => st.setCompare(!st.compareArt)}
                  >
                    {st.compareArt ? "Voltar ao depois" : "Ver antes"}
                  </button>
                </div>
              </Section>
              <PrintLayersPanel />
              <ArtPanel />
            </>
          ) : (
            <p className="cg-hint">Clique em uma caneca ou abra Camadas.</p>
          )}
        </aside>
      </div>
      <footer className="cg-statusbar">
        <button
          onClick={() =>
            st.patch("camera", { autoRotate: !st.camera.autoRotate })
          }
        >
          {st.camera.autoRotate ? <Pause /> : <Play />}
          {st.camera.autoRotate ? "Pausar giro" : "Girar automaticamente"}
        </button>
        <span className="cg-shortcuts">
          Shift + clique: seleção múltipla · Ctrl+D: duplicar · Delete: apagar ·
          Ctrl+Z: desfazer
        </span>
        <div>
          <ToolButton
            label="Guias"
            active={st.showGuides}
            onClick={() => st.setShowGuides(!st.showGuides)}
          >
            <Grid3X3 />
          </ToolButton>
          <button
            className="cg-mobile-properties"
            onClick={() => setDrawer("properties")}
          >
            <Settings2 />
            Propriedades
          </button>
          <button
            onClick={() =>
              document.querySelector(".cg-workspace")?.requestFullscreen?.()
            }
            aria-label="Tela cheia"
          >
            <Maximize />
          </button>
        </div>
      </footer>
    </div>
  );
}
function ArtPreview({ art }: { art: ArtState }) {
  const entry = getArtImage(art.imageId);
  const [url, setUrl] = useState("");
  ReactUseEffect(() => {
    let alive = true;
    import("../lib/art-registry").then(async (m) => {
      const blob = await m.getArtBlob(art.imageId);
      if (blob && alive) {
        const u = URL.createObjectURL(blob);
        setUrl(u);
      }
    });
    return () => {
      alive = false;
    };
  }, [art.imageId]);
  ReactUseEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url ? (
    <img src={url} alt="Arte original selecionada" />
  ) : (
    <div className="cg-art-placeholder">
      <ImagePlus />
    </div>
  );
}
