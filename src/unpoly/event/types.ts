/**
An event emitted by Unpoly.

Most Unpoly events are emitted on an element. Global events like `up:framework:booted` or
`up:network:late` are emitted on the `document`, as is the second dispatch of an event that must
bubble from a detached element.
*/
export interface UpEvent extends Event {
  target: Element | Document
}
