---
id: version-1.4.0-timeshift
title: Timeshifts with BarbelHisto
sidebar_label: Journey through time
original_id: timeshift
---
One of `BarbelHisto`s core functionality is doing timeshifts. With timeshifts you can look at past data as if it were still active. Let's suppose you did not make the updates from our previous example above at the same day like we just did in our turorial. Let's suppose we've created the `Employee` from our previous example on Feb 1st, 2019 and then made some changes today (here 2019, February 18th) that should become effective in the future. The journal of such a scenario looks like this:
```
Document-ID: somePersonelNumber

|Version-ID                              |Effective-From |Effective-Until |State   |Created-By           |Created-At                                   |Inactivated-By       |Inactivated-At                               |Data                           |
|----------------------------------------|---------------|----------------|--------|---------------------|---------------------------------------------|---------------------|---------------------------------------------|-------------------------------|
|5aec57db-0e4e-49b0-b79a-adf2affa8e13    |2019-02-18     |999999999-12-31 |INACTIVE|SYSTEM               |2019-02-01T00:00:00+01:00[Europe/Berlin]     |SYSTEM               |2019-02-18T11:57:24.738+01:00[Europe/Berlin] |EffectivePeriod [from=2019-02- |
|25b5e11c-70ce-4fc5-9b7a-ff9dd92d0dd2    |2019-02-18     |2019-02-28      |ACTIVE  |SYSTEM               |2019-02-18T11:57:24.738+01:00[Europe/Berlin] |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-02- |
|6fc067c7-57bc-4b69-9238-e19bd2269e0b    |2019-02-28     |999999999-12-31 |ACTIVE  |SYSTEM               |2019-02-18T11:57:24.738+01:00[Europe/Berlin] |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-02- |
``` 
When you want to see the journal that was active **before** you've made that second change on February 18th (see CreatedAt), you just receive that journal by using `BarbelHisto`s timeshift function:
```java
DocumentJournal journal = core.timeshift("somePersonelNumber", LocalDate.of(2019,2,17)); // yesterday in our scenarion was 2019, Febuary 17th
```
The journal you receive in the `DocumentJournal` looks as follows:
``` 
Document-ID: somePersonelNumber

|Version-ID                              |Effective-From |Effective-Until |State   |Created-By           |Created-At                                   |Inactivated-By       |Inactivated-At                               |Data                           |
|----------------------------------------|---------------|----------------|--------|---------------------|---------------------------------------------|---------------------|---------------------------------------------|-------------------------------|
|ab4abf42-2561-4a6e-afe7-5c8938736080    |2019-02-18     |999999999-12-31 |ACTIVE  |SYSTEM               |2019-02-01T00:00:00+01:00[Europe/Berlin]     |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-02- |
```
It's exactly that journal that was active before you've made your second update. These kind of scenarios can get much more complex as you continuously change employee records or othe bitemporal data. `BarbelHisto` considerably reduces the amount of complexity for developers dealing with such requirements.
