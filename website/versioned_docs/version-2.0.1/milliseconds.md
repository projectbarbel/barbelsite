---
id: version-2.0.1-millis
title: Version 2.0 on milliseconds
sidebar_label: Effective Time Granularity
original_id: millis
---

Please keep in mind that `BarbelHisto` in Version 2.0 is on <b>millisecond granularity</b> on effective periods. That means that it cannot detect differences in effective time lower then a millisecond. 

By default `BarbelHisto` will strip the nano seconds in the effective period to get to a ms granularity.

> Notice: 1,000,000 nanoseconds – one millisecond (ms)

An example:

```java
BarbelHisto<DefaultPojo> core = BTExecutionContext.INSTANCE.barbel(DefaultPojo.class).build();
DefaultPojo pojo = new DefaultPojo("someSome", "some data");

// This creates object valid for 0 milliseconds
core.save(pojo, now, now.plusNanos(1));

// This creates object valid for 0 milliseconds
core.save(pojo, now, now.plusNanos(10));

// This creates object valid for 1 milliseconds
core.save(pojo, now, now.plusNanos(1000000));

// This creates object valid for 10 milliseconds
core.save(pojo, now, now.plusNanos(10000000));
```

More complicated example:

```java
// This creates object valid for 10 milliseconds
core.save(pojo, now, now.plusNanos(10000000));
// Then you may illegaly want to add version on nano granularity
core.save(changedPojo, now.plusNanos(5), now.plusNanos(100));

// you would probably expect this result of object version records:
// now|---|
//        |-----------------|100 nanos
//        5
//                          |--------------->>--------------|10 ms

// but since BarbelHisto can only detect millis,
// this will be the result:
//    |------------>>----------|10 ms (existing first version)
// now| (your new sub milli object state version with no duration 
//      measurable in ms)

// you did not lose your data or invalidated the log
// but your sub milli seconds version has no duration !
```

`BarbelHisto` will ensure that you don't loose data when you accidentially record effective times on ms level. But these object versions will have no duration.