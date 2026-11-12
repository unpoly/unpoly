/**
The settings in `up.protocol.config`, described in its doc comment.
*/
export interface ProtocolConfig {
  methodParam: string
  csrfParam: string | (() => string | undefined)
  csrfToken: string | (() => string | undefined)
  csrfHeader: string
  maxHeaderSize: number
}
