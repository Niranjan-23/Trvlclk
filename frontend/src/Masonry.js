import React, { useState, useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import "./Masonry.css";

const Masonry = ({
  items = [],
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  onItemClick,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const itemRefs = useRef([]);

  // Responsive column calculation
  const getColumnCount = (width) => {
    if (width <= 600) return 2; // Mobile: 2 columns
    if (width <= 900) return 3; // Tablet: 3 columns
    if (width <= 1200) return 4; // Tablet/Small Desktop: 4 columns
    return 5; // Large Desktop: 5+ columns
  };

  // Track container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    
    // ResizeObserver for container element specifically
    let resizeObserver;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateWidth);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Compute Masonry Grid layout positions
  const { layoutItems, containerHeight } = useMemo(() => {
    if (!containerWidth || items.length === 0) {
      return { layoutItems: [], containerHeight: 0 };
    }

    const columns = getColumnCount(containerWidth);
    const gap = 16; // spacing in px
    const colWidth = (containerWidth - gap * (columns - 1)) / columns;
    const colHeights = new Array(columns).fill(0);

    const computedItems = items.map((item, index) => {
      // Find shortest column
      let minCol = 0;
      for (let c = 1; c < columns; c++) {
        if (colHeights[c] < colHeights[minCol]) {
          minCol = c;
        }
      }

      const left = minCol * (colWidth + gap);
      const top = colHeights[minCol];
      // Item height specified or calculated fallback
      const itemHeight = item.height || 300;

      colHeights[minCol] += itemHeight + gap;

      return {
        ...item,
        left,
        top,
        width: colWidth,
        height: itemHeight,
        index,
      };
    });

    const maxHeight = Math.max(...colHeights, 0);
    return { layoutItems: computedItems, containerHeight: maxHeight };
  }, [items, containerWidth]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (layoutItems.length === 0) return;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;

      const item = layoutItems[idx];
      if (!item) return;

      let startX = item.left;
      let startY = item.top;
      let startScale = 1;

      switch (animateFrom) {
        case "top":
          startY = item.top - 80;
          break;
        case "left":
          startX = item.left - 80;
          break;
        case "right":
          startX = item.left + 80;
          break;
        case "center":
          startScale = 0.7;
          break;
        case "random":
          startX = item.left + (Math.random() - 0.5) * 150;
          startY = item.top + (Math.random() - 0.5) * 150;
          break;
        case "bottom":
        default:
          startY = item.top + 80;
          break;
      }

      gsap.fromTo(
        el,
        {
          x: startX,
          y: startY,
          opacity: 0,
          scale: startScale,
          filter: blurToFocus ? "blur(12px)" : "blur(0px)",
        },
        {
          x: item.left,
          y: item.top,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: duration,
          ease: ease,
          delay: idx * stagger,
          overwrite: "auto",
        }
      );
    });
  }, [layoutItems, ease, duration, stagger, animateFrom, blurToFocus]);

  const handleMouseEnter = (e, index) => {
    const el = itemRefs.current[index];
    if (scaleOnHover && el) {
      gsap.to(el, {
        scale: hoverScale,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleMouseLeave = (e, index) => {
    const el = itemRefs.current[index];
    if (scaleOnHover && el) {
      gsap.to(el, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="masonry-container"
      style={{ height: containerHeight ? `${containerHeight}px` : "auto" }}
    >
      {layoutItems.map((item, index) => (
        <div
          key={item.id || index}
          ref={(el) => (itemRefs.current[index] = el)}
          className={`masonry-item ${colorShiftOnHover ? "color-shift" : ""}`}
          style={{
            width: `${item.width}px`,
            height: `${item.height}px`,
            position: "absolute",
            left: 0,
            top: 0,
            willChange: "transform, opacity, filter",
          }}
          onMouseEnter={(e) => handleMouseEnter(e, index)}
          onMouseLeave={(e) => handleMouseLeave(e, index)}
          onClick={() => onItemClick && onItemClick(item)}
        >
          <div className="masonry-item-inner">
            <img
              src={item.img}
              alt={item.title || "Post thumbnail"}
              loading="lazy"
              className="masonry-img"
            />
            <div className="masonry-overlay">
              {item.post?.user && (
                <div className="masonry-user-info">
                  <img
                    src={item.post.user.profileImage || "/default-avatar.png"}
                    alt={item.post.user.username || "User"}
                    className="masonry-avatar"
                  />
                  <span className="masonry-username">
                    {item.post.user.username || "User"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Masonry;
