// geometry.js
// Basic geometry utilities for rectangles and points

/**
 * Check if two axis-aligned rectangles intersect.
 * @param {{x:number,y:number,width:number,height:number}} r1
 * @param {{x:number,y:number,width:number,height:number}} r2
 * @returns {boolean}
 */
export function rectanglesIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }
  
  /**
   * Check if a point is inside an axis-aligned rectangle.
   * @param {number} x
   * @param {number} y
   * @param {{x:number,y:number,width:number,height:number}} rect
   * @returns {boolean}
   */
  export function pointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }
  