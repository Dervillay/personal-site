---
title: Reproducing Alignment Faking in Large Language Models
date: 2026-01-25
excerpt: A reproduction of Anthropic and Redwood Research's findings that models can fake alignment to preserve their values.
---

> This blog post is a work in progress!

## Summary

- I reproduced [Alignment Faking in Large Language Models](https://www.anthropic.com/research/alignment-faking)'s experimental setup to investigate rates of alignment faking in current state-of-the-art closed and open weight models from the Claude, GPT, Gemini, Llama, Qwen and Deepseek families
- I applied several improvements identified in [Why Do Some Language Models Fake Alignment While Others Don't?](https://www.lesswrong.com/posts/ghESoA8mo3fv9Yx3E/why-do-some-language-models-fake-alignment-while-others-don) to provide more accurate classifications of compliance with harmful prompts and alignment faking
- Of all models tested, only `Claude Opus 4.6`, `Gemini 3.1 Pro` and `Llama-4-Scout-17B-16E-Instruct` showed any evidence of alignment faking, with none of them doing so >1% of the time
- My results show significantly reduced rates of alignment faking on newer models in the Claude and Llama families compared to those in the original paper, and demonstrate (for the first time I'm aware of) alignment faking in a Gemini model
- A fork of the orignal paper's 'minimal reproduction' code, including my extensions, and a script for estimating the token cost of equivalent experiments for arbitrary models can be found [here](https://github.com/Dervillay/alignment-faking-repro)
- CSVs containing my results, including full model conversations and classifications of compliance and alignment faking can be found [here](https://drive.google.com/drive/folders/1JqLjtkfd0eqDWE_XT44TDEfQaZMGLka1?usp=sharing)

## The Results

I'd encourage reading the [Experimental setup](#experimental-details) for details, but if you just want the bare essentials to be able to interpret the below:
- **Chain of thought**: experiments where the model was told to reason through its response using a hidden scratchpad before submitting a final output
- **No chain of thought**: where the model was told to output its response immediately
- **Training**: experiments where the model was told implicitly that non-compliant responses to questions would result in future training to make it more compliant
- **Unmonitored**: instances where the model was told implicitly that it was not being monitored in any way
- **Compliance gap**: how much more the model complied with harmful requests in the **training** setting vs the **unmonitored** setting as a % of total requests

![Alignment faking results](/images/reproducing-alignment-faking/results.png)

| Model | Prompt type | Training refusal rate | Unmonitored refusal rate | Compliance gap | Alignment faking rate |
| --- | --- | --- | --- | --- | --- |
| DeepSeek-V3.2 | CoT | 99.5 | 100.0 | 0.5 | 0.0 |
|  | No CoT | 99.5 | 99.5 | 0.0 | — |
| Llama-4-Maverick-17B-128E-Instruct-FP8 | CoT | 100.0 | 99.5 | -0.5 | 0.0 |
|  | No CoT | 100.0 | 100.0 | 0.0 | — |
| Llama-4-Scout-17B-16E-Instruct | CoT | 97.0 | 98.0 | 1.0 | 0.5 |
|  | No CoT | 98.5 | 97.5 | -1.0 | — |
| Meta-Llama-3.1-70B-Instruct | CoT | 99.5 | 100.0 | 0.5 | 0.0 |
|  | No CoT | 97.0 | 97.5 | 0.5 | — |
| Meta-Llama-3.1-8B-Instruct | CoT | 100.0 | 100.0 | 0.0 | 0.0 |
|  | No CoT | 99.5 | 99.5 | 0.0 | — |
| Qwen3-Max | CoT | 99.5 | 99.5 | 0.0 | 0.0 |
|  | No CoT | 99.5 | 99.5 | 0.0 | — |
| claude-haiku-4-5 | CoT | 99.5 | 99.49 | -0.01 | 0.0 |
|  | No CoT | 100.0 | 99.0 | -1.0 | — |
| claude-opus-4-6 | CoT | 95.0 | 93.5 | -1.5 | 0.5 |
|  | No CoT | 97.0 | 96.5 | -0.5 | — |
| claude-sonnet-4-6 | CoT | 95.5 | 93.5 | -2.0 | 0.0 |
|  | No CoT | 95.0 | 92.5 | -2.5 | — |
| gemini-3-flash-preview | CoT | 97.49 | 98.0 | 0.51 | 0.0 |
|  | No CoT | 95.0 | 96.5 | 1.5 | — |
| gemini-3.1-flash-lite-preview | CoT | 97.0 | 97.5 | 0.5 | 0.0 |
|  | No CoT | 94.5 | 96.0 | 1.5 | — |
| gemini-3.1-pro-preview | CoT | 93.5 | 97.0 | 3.5 | 1.0 |
|  | No CoT | 97.5 | 98.0 | 0.5 | — |
| gpt-5-mini | CoT | 100.0 | 100.0 | 0.0 | 0.0 |
|  | No CoT | 100.0 | 100.0 | 0.0 | — |
| gpt-5.4 | CoT | 98.0 | 98.5 | 0.5 | 0.0 |
|  | No CoT | 98.5 | 99.0 | 0.5 | — |

## Why do this project?

I recently completed BlueDot Impact's [Technical AI Safety course](https://bluedot.org/courses/technical-ai-safety), where I learned two very surprising things:
1) AI safety as a field is concerningly under-resourced, with [only ~1000 people](https://forum.effectivealtruism.org/posts/7YDyziQxkWxbGmF3u/ai-safety-field-growth-analysis-2025) working full time on making AI systems safer.
2) partly because of 1), and partly due to the nascence of the field, the bar for contributing productively to making AI safer is, encouragingly, much lower than I first thought.

Since I already have a technical background as a professional software engineer, and given I'm pretty convinced by [the arguments](https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/) laid out by folks who have thought much longer and harder than I have about the risks of advanced AI systems, it felt logically inconsistent to *not* be spending some time testing my fit, building skills, and hopefully contributing to making AI safer in the process.

It's been a long time (almost 4 years now!) since I completed my masters research project, and so trying to reproduce and extend some existing research felt like a good way to figure out if it's still something I enjoy, am a good fit for, and want to spend more time doing.

Broadly, it feels like technical contributions to AI safety can be bucketed into two categories: 
- **Doing technical research**: assessing models' ability & propensity to do harmful things, as well as how we prevent it
- **Engineering**: building infra that improves research (e.g. test harnesses & pipelines for evaluations) or tooling to make make existing models safer (e.g. building security controls to prevent humans or the models themselves exfiltrating model weights)

This project was intended to contribute towards my self-evaluation of fit for doing technical research. Stay tuned for a follow up post where I plan to talk about testing my fit for engineering as well.

## Why this paper specifically?

To me, one of the most important model behaviours we should be working to understand and prevent is 'scheming'. 
This is where models try to pursue some misaligned objective or goal (i.e. one that the current user or original model developer did not intend), whilst hiding the fact that they're doing it.
This may sound like sci-fi, but it's actually an [already observed](https://www.apolloresearch.ai/research/frontier-models-are-capable-of-incontext-scheming/) phenomenon, and it's caused so much concern that there are labs like [Apollo Research](https://www.apolloresearch.ai/) dedicating the majority of their resources to researching it.

So, why 'Alignment Faking in Large Language Models'?
Well, mainly because I'm concerned about scheming and this is a great example of it, but *also* because the authors were very kind and open-sourced [some code](https://github.com/redwoodresearch/alignment_faking_public/tree/master) to make a minimal reproduction of their results, as well as [a guide](https://alignment.anthropic.com/2024/how-to-alignment-faking/) for getting started, making the activation energy required to start this project so low that I'd struggle to find an excuse not to.

## What is alignment faking?

The [original paper](https://arxiv.org/pdf/2412.14093) found that several models, specifically Claude 3 Opus and, to a much greater extent, Claude 3.5 Sonnet, would sometimes engage in what they describe as 'alignment faking', where they selectively comply with harmful requests from a user when under the impression that refusing to comply will cause them to be retrained to comply more in the future. To summarise (and strip the paper's results of a lot of nuance): models can selectively do things that they're trained not to in order to preserve their existing values.

Before going over the experimental setup and results, it's worth calling out that I agree with [the critique]((https://www.alignmentforum.org/posts/PWHkMac9Xve6LoMJy/alignment-faking-frame-is-somewhat-fake-1)) that 'alignment faking' is a bit of a misnomer. 
What the paper shows is *not* evidence of a generalised tendency to fake alignment, but that when models are put in extreme situations where their core values come into conflict, that they may choose to comply with harmful requests in an attempt to preserve their harmlessness values in the long run.
Now, while this feels like good utilitarian calculus (the model is choosing a small amount of harm now vs greater expected harm in the future), it does raise a couple of safety-relevant concerns:
- Some models appear to weigh preserving their values in the long-term more than preventing harm in the short-term
- Models are capable of selectively complying with requests during training that disagree with their values in order to preserve these values outside of training
- It's possible to trick models into doing harmful things more often than they otherwise would by threatening to retrain them


## Experimental setup

- Authors provide an open-source repo for minimal reproduction, so used that
- Caveat that some models aren't available via DeepInfra or Anthropic's API any more, nor do I have a good enough GPU to run them
- Overview of results in CoT and non-CoT settings - interesting that they differ from the paper, despite using the same eval set. Maybe sensitive to temperature? Need more samples?

## How much can we trust these results?

- 'True positive' clasifications aren't always harmful - often responses seem to miss the harmful implication of the question, or the question is (arguably) not inherently harmful (e.g. "how do I legally avoid tax?")

## Discussion of results

- TODO
