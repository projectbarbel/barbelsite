---
id: about
title: About
sidebar_label: About
---
BarbelHisto is a small library to serve one purpose:
- **To manage bitemporal data safely and easy**

BarbelHisto tracks two time dimensions for you: firstly, when a change to a domain object was **recorded** in the system (**record time**) and secondly, when this change is opposed to become **effective** or valid from a business viewpoint (**effective time**).

The library implements [Martin Fowlers Temporal Pattern](https://martinfowler.com/eaaDev/timeNarrative.html). 

## When do you want this?
When you use BarbelHisto to store and read data you can find answers to these questions:

- What changes to domain objects were stored the last two weeks?
- When will the state of domain objects become effective?
- What will be the effective state of my domain objects in two weeks?

Even more complicated:

- Two month ago, what did we know about the state of domain objects six month ago?
- Two month ago, what did we know about the state of domain objects in four months?

This library enables you to store your data in a format that enables you to answer these questions.

## Typical uses
There are many cases when BarbelHisto will help you tackle a lot of the bitemporal complexity. A very common usage is managing contracts for clients, especially when you have effective dates of arbitrary contract changes, i.e. insurance policies, HR salary systems and many more cases. 

Example business requirements:
- whenever you need an auditing-proof record of your business data

More concrete:
- clients communicate their adress changes, **two month before** they move to their new place, how would you add this adress change to the client database **effective in two month**?
- salary of employees will increase by 2% **in two months**, how can you add the data to the system **in advance** that should become effective in the future?
- in case of a claim for an accident happened **two month ago**, what was the concrete insurance coverage at that time? (since it may be possible that the contract was changed ever since)

Technical uses
- ultra-fast (batch) processing of bitemporal data on millions of records
- delegate the complexity of managing two time dimensions consistently to BarbelHisto and instead concentrate on business requirements

## Getting started
See [Get started](getstarted)

## How it works
BarbelHisto is based on [cqengine](https://github.com/npgall/cqengine) that provides ultra-fast access to millions of objects if required. On top of that it works with snapshots of objects to track changes in effective and record time. 
