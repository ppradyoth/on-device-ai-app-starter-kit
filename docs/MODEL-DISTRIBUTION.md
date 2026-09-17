# Model distribution

Phase 2 uses one explicit model profile:

| Field        | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| Model        | Qwen3-0.6B-GGUF                                                    |
| File         | `Qwen3-0.6B-Q8_0.gguf`                                             |
| Quantization | Q8_0                                                               |
| Size         | 639,446,688 bytes (639 MB decimal)                                 |
| Context      | 32,768 tokens                                                      |
| License      | Apache-2.0                                                         |
| Runtime      | `@wllama/wllama@3.6.1`                                             |
| Delivery     | Explicit browser download from Hugging Face                        |
| SHA-256      | `9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031` |

The model is not committed to this repository. The browser downloads it only
after the user activates setup, verifies the complete blob before loading it,
and stores the verified blob in application-owned IndexedDB model storage.
Integrity failure clears the model cache and prevents runtime loading.

Sources:

- [Qwen3-0.6B-GGUF model card](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF)
- [Hugging Face file metadata](https://huggingface.co/api/models/Qwen/Qwen3-0.6B-GGUF/tree/main?recursive=true)
- [wllama README](https://github.com/ngxson/wllama)
- [wllama v3 API guide](https://github.com/ngxson/wllama/blob/master/guides/intro-v3.md)

The selected model and runtime have been exercised on the development Apple
Silicon browser profile. The cross-device matrix remains unverified until the
compatibility phase.
