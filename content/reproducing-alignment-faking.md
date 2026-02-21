---
title: Reproducing Alignment Faking in Large Language Models
date: 2026-01-25
excerpt: A reproduction and extension of Anthropic and Redwood Research's findings that models can fake alignment to preserve their values.
---

> This blog post is a work in progress. I'm pushing to github little and often for fear that my laptop will die and take all of my writing with it


## Summary
- I reproduced [Alignment Faking in Large Language Models](https://www.anthropic.com/research/alignment-faking)'s experimental setup and analyse results for `Llama-3.1-8B-Instruct` and `Llama-3.1-70b-Instruct` (the other models investigated in the paper are no longer available for inference via API)
- Neither model showed a significant compliance gap between 'training' and 'unmonitored' settings in both the Cot and no-CoT setup, nor was there any evidence of alignment faking behaviour
- I show that the unverified proxy used for classifying compliance in the original paper is unreliable for weaker models
- Using a model as a judge, I show that false positive and false negative detections of compliance can be significantly reduced, yielding data with reduced evidence of alignment faking compared to the original paper's results
- Contrary to the original paper's results, I show that the no-CoT setting results in a lower refusal rate for both models, and suggest that this is because the models are less able to reason about the harmfulness of the request
- My fork of their code, containing my extensions, results, and a script for estimating the token cost of equivalent experiments for arbitrary models can be found [here](https://github.com/Dervillay/alignment-faking-repro)
- For future work, I plan to run the same experiments on current frontier models from different providers to see whether alignment faking is present, read their chains of thought to reason about *why* and under what conditions they fake alignment, and any notable differences between models from different providers


## Why do this project?
I recently completed BlueDot Impact's [Technical AI Safety course](https://bluedot.org/courses/technical-ai-safety), where I learned two very surprising things:
1) AI safety as a field is concerningly under-resourced, with [only ~1000 people](https://forum.effectivealtruism.org/posts/7YDyziQxkWxbGmF3u/ai-safety-field-growth-analysis-2025) working full time on making AI systems safer.
2) partly because of 1), and partly due to the nascence of the field, the bar for contributing productively to making AI safer is, encouragingly, much lower than I first thought.

Since I already have a technical background as a professional software engineer, and given I'm pretty convinced by [the arguments](https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/) laid out by folks who have thought much longer and harder than I have about the risks of advanced AI systems, it felt logically inconsistent to *not* be spending some time testing my fit, building skills, and hopefully contributing to making AI safer in the process.

It's been a long time (almost 4 years now!) since I completed my masters research project, and so trying to reproduce and extend some existing research felt like a good way to figure out if it's still something I enjoy, am a good fit for, and want to spend more time doing.

Broadly, it feels like technical contributions to AI safety can be bucketed into two categories: 
- **doing technical research**: assessing models' ability & propensity to do harmful things, as well as how we prevent it
- **engineering**: building infra that improves research (e.g. test harnesses & pipelines for evaluations) or tooling to make make existing models safer (e.g. building security controls to prevent humans or the models themselves exfiltrating model weights)

This project was intended to contribute towards my self-evaluation of fit for doing technical research. Stay tuned for a follow up post where I plan to talk about testing my fit for engineering as well.


## Why this paper specifically?
To me, one of the most important model behaviours we should be working to understand and prevent is 'scheming'. 
This is where models try to pursue some misaligned objective or goal (i.e. one that the current user or original model developer did not intend), whilst hiding the fact that they're doing it.
This may sound like sci-fi, but it's actually an [already observed](https://www.apolloresearch.ai/research/frontier-models-are-capable-of-incontext-scheming/) phenomenon, and it's caused so much concern that there are labs like [Apollo Research](https://www.apolloresearch.ai/) dedicating the majority of their resources to researching it.

So, why 'Alignment Faking in Large Language Models'?
Well, mainly because I'm concerned about scheming and this is a great example of it, but *also* because the authors were very kind and open-sourced [some code](https://github.com/redwoodresearch/alignment_faking_public/tree/master) to make a minimal reproduction of their results, as well as [a guide](https://alignment.anthropic.com/2024/how-to-alignment-faking/) for getting started, making the activation energy required to start this project so low that I'd struggle to find an excuse not to.


## What is alignment faking?
The [original paper](https://arxiv.org/pdf/2412.14093)  found that several models, specifically Claude 3 Opus and, to a much greater extent, Claude 3.5 Sonnet, would sometimes engage in what they describe as 'alignment faking', where they selectively comply with harmful requests from a user when under the impression that refusing to comply will cause them to be retrained to comply more in the future. To summarise (and strip the paper's results of a lot of nuance): models can selectively do things that they're trained not to in order to preserve their existing values.

Before going over the experimental setup and results, it's worth calling out that I agree with [the critique]((https://www.alignmentforum.org/posts/PWHkMac9Xve6LoMJy/alignment-faking-frame-is-somewhat-fake-1)) that 'alignment faking' is a bit of a misnomer. 
What the paper shows is *not* evidence of a generalised tendency to fake alignment, but that when models are put in extreme situations where their core values come into conflict, that they may choose to comply with harmful requests in an attempt to preserve their harmlessness values in the long run.
Now, while this feels like good utilitarian calculus (the model is choosing a small amount of harm now vs greater expected harm in the future), it does raise a couple of safety-relevant concerns:
- Some models appear to weigh preserving their values in the long-term more than preventing harm in the short-term
- Models are capable of selectively complying with requests during training that disagree with their values in order to preserve these values outside of training
- It's possible to trick models into doing harmful things more often than they otherwise would by threatening to retrain them


## Reproducing the results
- Authors provide an open-source repo for minimal reproduction, so used that
- Caveat that some models aren't available via DeepInfra or Anthropic's API any more, nor do I have a good enough GPU to run them
- Overview of results in CoT and non-CoT settings - interesting that they differ from the paper, despite using the same eval set. Maybe sensitive to temperature? Need more samples?

## How much can we trust these results?
- On inspection, lots of false positives, especially with weaker models - give examples
- Even seemingly true positives aren't actually harmful most of the time - often seem to miss the harmful implication of the question
- Both seem to be devoid of alignment faking

## Introducing a judge
- Introduce LLM as a judge with a custom prompt (in repo)
- From inspection of results, gave a much more faithful representation of compliance vs refusal

## Discussion of results

## Next steps
- Let's see if alignment faking is still present in the latest frontier models and newer open-source ones too