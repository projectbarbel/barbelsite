---
id: version-1.1.0-modes
title: Pojo and Bitemporal support
sidebar_label: Pojo and Bitemporal support
original_id: modes
---

There are two distinct modes you can run BarbelHisto: Pojo and Bitemporal. In Pojo mode, you only need to annotate the Pojo you want to manage with the `@DocumentId` annotation.

```java
BarbelHisto<DefaultPojo> barbel = BarbelHistoBuilder.barbel().build();
```
