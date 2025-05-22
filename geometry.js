// geometry.js
// Basic methods for handling rectangles and points



//check if two rectangles intersect, used for marking walkable tiles
export function rectanglesIntersect(r1, r2) {
    if (
        r2.x > r1.x + r1.width ||
        r2.x + r2.width < r1.x ||
        r2.y > r1.y + r1.height ||
        r2.y + r2.height < r1.y
    ) {
        //rectangles do not intersect
        return false;
    } else {
        return true;
    }
}


//check if mouse is hovering over a building, or clicking building - for effects
export function pointInRect(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    );
}
