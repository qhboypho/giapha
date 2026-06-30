import { useState, useRef, useEffect, useMemo } from "react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { buildLayout } from "../utils/treeLayout";
import { getAge } from "../utils/mockData";
import { sortMembersByBirthOrder } from "../utils/sortUtils";

function TreePersonAvatar({ person, className = "" }) {
  if (person.avatar) {
    return <img src={person.avatar} alt={person.name} className={className} />;
  }

  return (
    <div className={`${className} generated-avatar`} style={getAvatarStyle(person)}>
      {getAvatarInitials(person.name)}
    </div>
  );
}

function getYearsLabel(person) {
  const age = getAge(person.birthDate, person.deathDate, person.isDeceased);
  if (person.isDeceased) return age ? `Hưởng thọ ${age} tuổi` : "Đã qua đời";
  return age ? `${age} tuổi` : "Chưa rõ tuổi";
}

function buildMobileTreeGroups(members) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const usedCouples = new Set();

  const parentCandidates = sortMembersByBirthOrder(
    members.filter((member) => (
      members.some((child) => child.fatherId === member.id || child.motherId === member.id)
    ))
  );

  const groups = parentCandidates
    .map((person) => {
      const spouses = (person.spouseIds || [])
        .map((id) => memberById.get(id))
        .filter(Boolean);
      const spouse = spouses[0] || null;
      const parentIds = spouse ? [person.id, spouse.id] : [person.id];
      const groupKey = parentIds.slice().sort().join("|");
      if (usedCouples.has(groupKey)) return null;
      usedCouples.add(groupKey);

      const parents = sortMembersByBirthOrder(parentIds.map((id) => memberById.get(id)).filter(Boolean));
      const children = sortMembersByBirthOrder(members.filter((member) => (
        parentIds.includes(member.fatherId) || parentIds.includes(member.motherId)
      )));

      if (children.length === 0) return null;
      const generation = Math.min(...parents.map((parent) => parent.generation || 0));

      return {
        id: groupKey,
        generation,
        parents,
        children
      };
    })
    .filter(Boolean)
    .sort((a, b) => (
      a.generation - b.generation ||
      a.parents[0].name.localeCompare(b.parents[0].name, "vi")
    ));

  const groupedMemberIds = new Set(groups.flatMap((group) => [
    ...group.parents.map((member) => member.id),
    ...group.children.map((member) => member.id)
  ]));
  const standalone = sortMembersByBirthOrder(members.filter((member) => !groupedMemberIds.has(member.id)));

  return { groups, standalone };
}

export default function TreeChart({
  members,
  selectedPersonId,
  onSelectPerson,
  searchQuery
}) {
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 100, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const clickStartCoord = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Compute the family tree layout
  const { nodes, links, width } = useMemo(() => buildLayout(members), [members]);
  const mobileTree = useMemo(() => buildMobileTreeGroups(members), [members]);

  // Center the layout on load
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const xOffset = (containerWidth - width * zoom) / 2;
      setPan({ x: Math.max(20, xOffset), y: 30 });
    }
  }, [width, zoom]);

  useEffect(() => {
    if (!selectedPersonId || !containerRef.current) return;

    const container = containerRef.current;
    const isMobileSheet = window.matchMedia("(max-width: 768px)").matches;
    if (isMobileSheet) {
      window.requestAnimationFrame(() => {
        const target = container.querySelector(`[data-mobile-member-id="${selectedPersonId}"]`);
        target?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }

    const selectedNode = nodes.find((node) => node.id === selectedPersonId);
    if (!selectedNode) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const targetViewportX = containerWidth / 2;
    const targetViewportY = containerHeight / 2;
    const nodeCenterX = selectedNode.x + selectedNode.width / 2;
    const nodeCenterY = selectedNode.y + selectedNode.height / 2;

    window.requestAnimationFrame(() => {
      setPan({
        x: targetViewportX - nodeCenterX * zoom,
        y: targetViewportY - nodeCenterY * zoom
      });
    });
  }, [nodes, selectedPersonId, zoom]);

  // Handle Dragging / Panning
  const handleMouseDown = (e) => {
    // Only drag if clicking on the canvas, not on cards or buttons
    if (e.target.closest(".member-card") || e.target.closest(".mobile-tree-view") || e.target.closest(".zoom-controls")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    clickStartCoord.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    if (e && e.clientX !== undefined) {
      const dx = Math.abs(e.clientX - clickStartCoord.current.x);
      const dy = Math.abs(e.clientY - clickStartCoord.current.y);
      if (dx < 5 && dy < 5) {
        if (!e.target.closest(".member-card") && !e.target.closest(".mobile-tree-view") && !e.target.closest(".zoom-controls")) {
          onSelectPerson(null);
        }
      }
    }
  };

  // Touch Support for Mobile
  const handleTouchStart = (e) => {
    if (e.target.closest(".member-card") || e.target.closest(".mobile-tree-view") || e.target.closest(".zoom-controls")) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    clickStartCoord.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    });
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    const touch = e.changedTouches[0];
    if (touch) {
      const dx = Math.abs(touch.clientX - clickStartCoord.current.x);
      const dy = Math.abs(touch.clientY - clickStartCoord.current.y);
      if (dx < 5 && dy < 5) {
        if (!e.target.closest(".member-card") && !e.target.closest(".mobile-tree-view") && !e.target.closest(".zoom-controls")) {
          onSelectPerson(null);
        }
      }
    }
  };

  const handleZoom = (factor) => {
    setZoom((prev) => Math.min(2, Math.max(0.3, prev * factor)));
  };

  const handleReset = () => {
    setZoom(0.85);
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const xOffset = (containerWidth - width * 0.85) / 2;
      setPan({ x: Math.max(20, xOffset), y: 30 });
    }
  };

  // Check if a node matches the search query
  const isMatch = (node) => {
    if (!searchQuery) return false;
    return node.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const isMemberMatch = (member) => {
    if (!searchQuery) return false;
    return member.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const renderMobilePersonCard = (person, variant = "child") => {
    const ageLabel = getYearsLabel(person);
    const isSelected = selectedPersonId === person.id;
    const highlighted = isMemberMatch(person);

    return (
      <button
        key={person.id}
        type="button"
        className={`mobile-tree-card ${variant} ${person.gender} ${person.isDeceased ? "deceased" : ""} ${isSelected ? "selected" : ""} ${highlighted ? "highlighted" : ""}`}
        data-mobile-member-id={person.id}
        onClick={() => onSelectPerson(person.id)}
      >
        <TreePersonAvatar person={person} className="mobile-tree-avatar" />
        <span className="mobile-tree-card-copy">
          <span className="mobile-tree-role">
            Đời {person.generation}
            {person.isDeceased ? " · Tạ thế" : " · Còn sống"}
          </span>
          <strong>{person.name}</strong>
          <small>{ageLabel}</small>
        </span>
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      className="tree-canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mobile-tree-view" aria-label="Cây gia phả dạng dọc">
        <div className="mobile-tree-view-head">
          <strong>Cây gia phả</strong>
          <span>Dòng dọc theo từng đời và nhánh gia đình.</span>
        </div>

        {mobileTree.groups.length === 0 && mobileTree.standalone.length === 0 ? (
          <div className="mobile-tree-empty">Chưa có dữ liệu thành viên để hiển thị cây gia phả.</div>
        ) : (
          <div className="mobile-tree-stack">
            {mobileTree.groups.map((group) => (
              <section className="mobile-tree-family" key={group.id}>
                <div className="mobile-tree-generation-pill">Đời {group.generation}</div>
                <div className={`mobile-tree-parents parents-${group.parents.length}`}>
                  {group.parents.map((person) => renderMobilePersonCard(person, "parent"))}
                </div>
                <div className="mobile-tree-connector" aria-hidden="true">
                  <span />
                </div>
                <div className="mobile-tree-children">
                  {group.children.map((person) => renderMobilePersonCard(person, "child"))}
                </div>
              </section>
            ))}

            {mobileTree.standalone.length > 0 && (
              <section className="mobile-tree-family standalone">
                <div className="mobile-tree-generation-pill">Thành viên khác</div>
                <div className="mobile-tree-children">
                  {mobileTree.standalone.map((person) => renderMobilePersonCard(person, "child"))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button className="zoom-btn glass glass-hover" onClick={() => handleZoom(1.15)}>➕</button>
        <button className="zoom-btn glass glass-hover" onClick={() => handleZoom(0.85)}>➖</button>
        <button className="zoom-btn glass glass-hover" onClick={handleReset} style={{ fontSize: "0.9rem" }}>🔄</button>
      </div>

      {/* SVG Canvas (Only renders connectors/lines) */}
      <svg
        className="tree-svg"
        width="100%"
        height="100%"
        style={{ pointerEvents: "none" }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {links.map((link) => (
            <path
              key={link.id}
              d={link.path}
              className={`tree-connector ${link.type === "spouse" ? "tree-connector-spouse" : ""}`}
            />
          ))}
        </g>
      </svg>

      {/* HTML Cards Layer (Overlay matching the SVG transform) */}
      <div
        className="tree-html-nodes-container"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          pointerEvents: "none"
        }}
      >
        {nodes.map((node) => {
          const age = getAge(node.birthDate, node.deathDate, node.isDeceased);
          const isSelected = selectedPersonId === node.id;
          const highlighted = isMatch(node);
          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
                height: `${node.height}px`,
                pointerEvents: "auto"
              }}
            >
              <div
                className={`member-card glass glass-hover ${node.gender} ${
                  node.isDeceased ? "deceased" : ""
                } ${isSelected ? "selected" : ""} ${highlighted ? "animate-scale-up" : ""} ${
                  node.isSpouse ? "spouse-card" : "blood-card"
                }`}
                style={highlighted ? {
                  borderColor: "var(--tree-search-highlight, var(--color-brand-accent))",
                  borderWidth: "2.5px",
                  boxShadow: "0 0 10px color-mix(in srgb, var(--tree-search-highlight, var(--color-brand-accent)) 55%, transparent)"
                } : {}}
                onClick={() => onSelectPerson(node.id)}
              >
                {/* Deceased Ribbon Indicator */}
                {node.isDeceased && <div className="deceased-ribbon" title="Đã qua đời" />}

                {/* Profile Avatar */}
                <div className="card-avatar-wrapper">
                  {node.avatar ? (
                    <img src={node.avatar} alt={node.name} className="card-avatar" />
                  ) : (
                    <TreePersonAvatar person={node} className="card-avatar" />
                  )}
                </div>

                {/* Card Details */}
                <div className="card-details">
                  <h4 className="card-name" title={node.name}>{node.name}</h4>
                  <span className="card-meta">
                    {node.isDeceased ? (
                      <>🪦 Hưởng thọ {age} tuổi</>
                    ) : (
                      <>🎂 {age ? `${age} tuổi` : "Chưa rõ tuổi"}</>
                    )}
                  </span>
                  <span className="card-gen">Đời {node.generation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
