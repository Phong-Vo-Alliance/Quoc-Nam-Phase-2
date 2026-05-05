/**
 * Patch để React không crash khi user dùng Google Translate (hoặc extension dịch khác).
 *
 * Vấn đề: Translator bọc text node bằng <font>, khi React commit deletion sẽ gọi
 * removeChild/insertBefore với parent đã bị thay đổi → NotFoundError.
 *
 * Giải pháp: Override 2 hàm DOM, nếu node không còn là con của parent thì tự tìm
 * parent thật rồi xoá. Reference: facebook/react#11538
 */

const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
  if (child.parentNode !== this) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    return child;
  }
  return originalRemoveChild.call(this, child) as T;
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function <T extends Node>(
  this: Node,
  newNode: T,
  referenceNode: Node | null,
): T {
  if (referenceNode && referenceNode.parentNode !== this) {
    return originalInsertBefore.call(this, newNode, null) as T;
  }
  return originalInsertBefore.call(this, newNode, referenceNode) as T;
};

export {};
