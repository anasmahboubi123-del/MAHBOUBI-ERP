// src/types/css.d.ts
// يُتيح استيراد ملفات CSS في TypeScript

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}