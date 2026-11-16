# Changelog

## 1.2.0 — 2026-11-16

- Added experimental browser-local G / Mic button assignments for the exact X9 EN 1003 original; standalone or combined with audio editing.
- Locked all Power bindings and retained factory pairing combinations and timing configuration in the builder, with final-image decompression and verification.
- Added bounded LZMA chunk rebuilding, application SDFS/CFG validation and checks that executable instructions and unrelated resources are unchanged.
- Added Russian, English and Chinese button-table research and scope disclosures. Custom bindings are software-validated only; no headset was flashed.
- Updated the Vite development dependency to 6.4.6 and pinned the MIT LZMA-JS dependency.

## 1.1.0 — 2026-11-14

- Expanded the verified original catalog to 13 images across 8 wireless models; added editable V9 Turbo+ 0035.
- Added original downloads with SHA256/size checks and informative model capabilities.
- Added an experimental Python CLI for exact V9 Pro 2 0032/1002, R9 0018 and G9 V2 0031 originals: inspect, extract, audio conversion, constrained rebuilding, preview and report.
- Retained SBC frame count, byte length and factory bitpool; G9 replacements preserve offsets and verify all JLFS CRCs and non-tone sections.
- Added Russian, English and Chinese research, compatibility and offline instructions, plus source/provenance references.
- Added FAQ and Schema.org metadata.

New offline profiles have software validation only. Browser rebuilding remains limited to AAC/ACT profiles. No direct flashing is implemented.

## 1.0.0 — 2026-11-13

First versioned release.

- Browser-local audio trimming, AAC-LC encoding, ACT packaging and firmware rebuilding.
- Catalog of eight checksum-pinned official headset images across five MCHOSE models.
- Resource discovery and factory-audio preview from the selected image.
- Russian, English and Simplified Chinese interface and documentation.
- Integrity checks for AOTA, XML and SDFS; preservation of executable payloads and non-target resources.
- Documented ACT/AAC format, validation scope and installation guidance.
- Static GitHub Pages deployment with verified factory-image caching and fallback.

Hardware validation covers the X9 English 1003 Power On replacement scenario. Other profiles are software-validated only. The application generates images and does not flash devices.
