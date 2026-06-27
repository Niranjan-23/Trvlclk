import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Masonry.css";

const Masonry = ({
  items = [],
  onItemClick,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const getColumnCount = (width) => {
    if (width <= 600) return 3;
    if (width <= 900) return 3;
    if (width <= 1200) return 4;
    return 5;
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    
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

  const { layoutItems, containerHeight } = useMemo(() => {
    if (!containerWidth || items.length === 0) {
      return { layoutItems: [], containerHeight: 0 };
    }

    const columns = getColumnCount(containerWidth);
    const gap = 16;
    const colWidth = (containerWidth - gap * (columns - 1)) / columns;
    const colHeights = new Array(columns).fill(0);

    const computedItems = items.map((item, index) => {
      let minCol = 0;
      for (let c = 1; c < columns; c++) {
        if (colHeights[c] < colHeights[minCol]) {
          minCol = c;
        }
      }

      const left = minCol * (colWidth + gap);
      const top = colHeights[minCol];
      const rawHeight = item.height || 300;
      const itemHeight = containerWidth <= 600 ? Math.min(rawHeight * 0.52, 160 + (index % 3) * 25) : rawHeight;

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

  return (
    <div
      ref={containerRef}
      className="masonry-container"
      style={{ height: containerHeight ? `${containerHeight}px` : "auto" }}
    >
      {layoutItems.map((item, index) => (
        <div
          key={item.id || index}
          className="masonry-item masonry-item-reveal"
          style={{
            width: `${item.width}px`,
            height: `${item.height}px`,
            position: "absolute",
            left: `${item.left}px`,
            top: `${item.top}px`,
            animationDelay: `${Math.min(index * 0.035, 0.4)}s`,
          }}
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
